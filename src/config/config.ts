import { getSupabaseClient } from '../core/client'
import { ConfigError, CONFIG_ERROR_CODES } from './errors'
import type { AppConfigData, GetConfigOptions } from './types'

export class Config {
  private configCache: Map<string, { data: AppConfigData; timestamp: number }> = new Map()

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

    // 缓存结果
    this.configCache.set(configKey, { data, timestamp: Date.now() })

    return data
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

    return data || []
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

    return data || []
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
}
