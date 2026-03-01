import { getSupabaseClient } from '../core/client'
import { configManager } from '../core/config'
import { deriveKey, decryptConfigData } from '../core/crypto'
import { ConfigError, CONFIG_ERROR_CODES } from './errors'
import type { AppConfigData, GetConfigOptions } from './types'

export class Config {
  private configCache: Map<string, { data: AppConfigData; timestamp: number }> = new Map()
  // 防止内存泄漏：缓存条目上限
  private static readonly MAX_CACHE_SIZE = 100
  // 缓存派生密钥，避免每次重复执行 PBKDF2（CPU 密集操作）
  private derivedKey: Uint8Array | null = null

  /**
   * 获取（并缓存）解密密钥
   * 使用 appKey + appId 派生 AES-256-GCM 密钥，只计算一次
   */
  private getDerivedKey(): Uint8Array {
    if (this.derivedKey === null) {
      const { appKey, appId } = configManager.getConfig()
      this.derivedKey = deriveKey(appKey, appId)
    }
    return this.derivedKey
  }

  /**
   * 解密单条配置的 config_data 字段
   * 未加密的旧数据原样返回，保持向后兼容
   */
  private decryptConfig(config: AppConfigData): AppConfigData {
    try {
      const key = this.getDerivedKey()
      return {
        ...config,
        config_data: decryptConfigData(config.config_data, key),
      }
    } catch {
      // 解密失败时返回原始数据（避免因旧数据格式导致崩溃）
      return config
    }
  }

  /**
   * 根据config_key获取配置
   */
  async getConfig(configKey: string, options?: Partial<GetConfigOptions>): Promise<AppConfigData> {
    const useCache = options?.useCache ?? true
    const cacheDuration = options?.cacheDuration ?? 5 * 60 * 1000 // 默认5分钟

    // 检查缓存
    if (useCache) {
      const cached = this.configCache.get(configKey)
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        return cached.data
      }
    }

    // 从数据库获取
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('app_configs')
      .select('*')
      .eq('config_key', configKey)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ConfigError(
          `配置不存在: ${configKey}`,
          CONFIG_ERROR_CODES.NOT_FOUND,
          error
        )
      }
      throw new ConfigError(
        `获取配置失败: ${error.message}`,
        CONFIG_ERROR_CODES.GET_FAILED,
        error
      )
    }

    // 缓存结果（缓存解密后的数据，避免重复解密）
    const decrypted = this.decryptConfig(data)
    this.setCacheEntry(configKey, { data: decrypted, timestamp: Date.now() })

    return decrypted
  }

  /**
   * 获取配置的特定字段值
   */
  async getConfigValue<T = any>(configKey: string, fieldKey: string, defaultValue?: T): Promise<T> {
    try {
      const config = await this.getConfig(configKey)
      const value = config.config_data[fieldKey]
      return value !== undefined ? value : (defaultValue as T)
    } catch (error) {
      if (defaultValue !== undefined) {
        return defaultValue
      }
      throw error
    }
  }

  /**
   * 获取配置的所有数据
   */
  async getConfigData(configKey: string): Promise<Record<string, any>> {
    const config = await this.getConfig(configKey)
    return config.config_data
  }

  /**
   * 批量获取多个配置
   */
  async getConfigs(configKeys: string[]): Promise<AppConfigData[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('app_configs')
      .select('*')
      .in('config_key', configKeys)
      .eq('is_active', true)

    if (error) {
      throw new ConfigError(
        `批量获取配置失败: ${error.message}`,
        CONFIG_ERROR_CODES.GET_FAILED,
        error
      )
    }

    return (data || []).map(item => this.decryptConfig(item))
  }

  /**
   * 按类型获取配置列表
   */
  async getConfigsByType(configType: string): Promise<AppConfigData[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('app_configs')
      .select('*')
      .eq('config_type', configType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new ConfigError(
        `获取配置列表失败: ${error.message}`,
        CONFIG_ERROR_CODES.GET_FAILED,
        error
      )
    }

    return (data || []).map(item => this.decryptConfig(item))
  }

  /**
   * 清除缓存
   */
  clearCache(configKey?: string): void {
    if (configKey) {
      this.configCache.delete(configKey)
    } else {
      this.configCache.clear()
    }
  }

  /**
   * 写入缓存，超出上限时清除最旧的条目
   */
  private setCacheEntry(key: string, value: { data: AppConfigData; timestamp: number }): void {
    if (this.configCache.size >= Config.MAX_CACHE_SIZE) {
      // Map 的迭代顺序是插入顺序，删除第一个（最旧）条目
      const firstKey = this.configCache.keys().next().value
      if (firstKey !== undefined) {
        this.configCache.delete(firstKey)
      }
    }
    this.configCache.set(key, value)
  }
}
