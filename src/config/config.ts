import { getSupabaseClient } from '../core/client'
import { configManager } from '../core/config'
import { deriveKey, decryptConfigData } from '../core/crypto'
import { AsyncCrypto } from '../core/crypto-async'
import { ConfigError, CONFIG_ERROR_CODES } from './errors'
import { PersistentCacheManager, type BackoffConfig } from './cache-manager'
import { UpdateScheduler } from './update-scheduler'
import { queryWithTimeout } from './timeout-controller'
import type { AppConfigData, GetConfigOptions, ConfigUpdateOptions } from './types'
import type { StorageAdapter } from '../core/types'

export class Config {
  private configCache: Map<string, { data: AppConfigData; timestamp: number }> = new Map()
  private static readonly MAX_CACHE_SIZE = 100
  private derivedKey: Uint8Array | null = null

  // 新增：持久化缓存管理器
  private persistentCache: PersistentCacheManager
  // 新增：更新调度器
  private updateScheduler: UpdateScheduler
  // 新增：异步解密
  private asyncCrypto: AsyncCrypto
  // 新增：配置选项
  private updateOptions: Required<ConfigUpdateOptions>

  constructor(storage: StorageAdapter, updateOptions?: ConfigUpdateOptions) {
    // 初始化默认配置
    this.updateOptions = {
      offlineFirst: true,
      updateThrottleMs: 24 * 60 * 60 * 1000, // 24h
      backgroundUpdateTimeoutMs: 1200, // 1.2s
      manualUpdateTimeoutMs: 10000, // 10s
      retryBackoff: {
        initialDelayMs: 1000,
        maxDelayMs: 60000,
        multiplier: 2,
        maxRetries: 5,
      },
      useWorkerForDecryption: true,
      persistentCachePrefix: 'accounthub_config_',
      storeDecryptedData: true,
      ...updateOptions,
    }

    // 初始化持久化缓存
    this.persistentCache = new PersistentCacheManager(
      storage,
      this.updateOptions.persistentCachePrefix
    )

    // 初始化更新调度器
    this.updateScheduler = new UpdateScheduler()

    // 初始化异步解密
    this.asyncCrypto = new AsyncCrypto(this.updateOptions.useWorkerForDecryption)
  }

  /**
   * 获取（并缓存）解密密钥
   */
  private getDerivedKey(): Uint8Array {
    if (this.derivedKey === null) {
      const { appKey, appId } = configManager.getConfig()
      this.derivedKey = deriveKey(appKey, appId)
    }
    return this.derivedKey
  }

  /**
   * 异步获取解密密钥
   */
  private async getDerivedKeyAsync(): Promise<Uint8Array> {
    if (this.derivedKey === null) {
      const { appKey, appId } = configManager.getConfig()
      this.derivedKey = await this.asyncCrypto.deriveKey(appKey, appId)
    }
    return this.derivedKey
  }

  /**
   * 解密单条配置（同步，向后兼容）
   */
  private decryptConfig(config: AppConfigData): AppConfigData {
    try {
      const key = this.getDerivedKey()
      return {
        ...config,
        config_data: decryptConfigData(config.config_data, key),
      }
    } catch {
      return config
    }
  }

  /**
   * 异步解密单条配置
   */
  private async decryptConfigAsync(config: AppConfigData): Promise<AppConfigData> {
    try {
      const key = await this.getDerivedKeyAsync()
      const decryptedData = await this.asyncCrypto.decryptConfigData(config.config_data, key)
      return {
        ...config,
        config_data: decryptedData,
      }
    } catch (error) {
      console.warn('[Config] 异步解密失败，返回原始数据:', error)
      return config
    }
  }

  /**
   * 根据config_key获取配置（增强版）
   */
  async getConfig(configKey: string, options?: Partial<GetConfigOptions>): Promise<AppConfigData> {
    const useCache = options?.useCache ?? true
    const cacheDuration = options?.cacheDuration ?? 5 * 60 * 1000
    const forceRefresh = options?.forceRefresh ?? false
    const fallbackValue = options?.fallbackValue
    const timeout = options?.timeout

    // 1. 检查内存缓存（5分钟有效）
    if (useCache && !forceRefresh) {
      const cached = this.configCache.get(configKey)
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        // 触发后台更新检查（非阻塞）
        this.triggerBackgroundUpdateIfNeeded(configKey)
        return cached.data
      }
    }

    // 2. 检查持久化缓存（永不过期）
    if (this.updateOptions.offlineFirst && useCache && !forceRefresh) {
      const persistentEntry = await this.persistentCache.get(configKey)
      if (persistentEntry) {
        // 写入内存缓存
        this.setCacheEntry(configKey, {
          data: persistentEntry.data,
          timestamp: Date.now(),
        })

        // 触发后台更新检查（非阻塞）
        this.triggerBackgroundUpdateIfNeeded(configKey)

        return persistentEntry.data
      }
    }

    // 3. 从数据库获取（带超时）
    try {
      const timeoutMs = timeout ?? this.updateOptions.manualUpdateTimeoutMs
      const data = await this.fetchFromDatabase(configKey, timeoutMs)

      // 4. 异步解密
      const decrypted = await this.decryptConfigAsync(data)

      // 5. 更新缓存
      await this.updateAllCaches(configKey, decrypted)

      return decrypted
    } catch (error) {
      // 降级到 fallbackValue
      if (fallbackValue) {
        console.warn(`[Config] 获取配置失败，使用降级值: ${configKey}`, error)
        return fallbackValue
      }
      throw error
    }
  }

  /**
   * 从数据库获取配置（带超时）
   */
  private async fetchFromDatabase(configKey: string, timeoutMs: number): Promise<AppConfigData> {
    const supabase = getSupabaseClient()

    const result = await queryWithTimeout(
      async () => {
        return await supabase
          .from('app_configs')
          .select('*')
          .eq('config_key', configKey)
          .eq('is_active', true)
          .single()
      },
      timeoutMs
    )

    const { data, error } = result as any

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

    return data
  }

  /**
   * 触发后台更新检查（非阻塞）
   */
  private triggerBackgroundUpdateIfNeeded(configKey: string): void {
    // 异步执行，不阻塞主流程
    this.checkAndScheduleBackgroundUpdate(configKey).catch((error) => {
      console.warn(`[Config] 后台更新检查失败: ${configKey}`, error)
    })
  }

  /**
   * 检查并调度后台更新
   */
  private async checkAndScheduleBackgroundUpdate(configKey: string): Promise<void> {
    // 获取缓存元数据
    const entry = await this.persistentCache.get(configKey)
    const metadata = entry?.metadata ?? null

    // 检查是否应该触发更新
    const backoffConfig: BackoffConfig = {
      initialDelayMs: this.updateOptions.retryBackoff.initialDelayMs ?? 1000,
      maxDelayMs: this.updateOptions.retryBackoff.maxDelayMs ?? 60000,
      multiplier: this.updateOptions.retryBackoff.multiplier ?? 2,
      maxRetries: this.updateOptions.retryBackoff.maxRetries ?? 5,
    }

    const shouldUpdate = this.updateScheduler.shouldTriggerBackgroundUpdate(
      metadata,
      this.updateOptions.updateThrottleMs,
      backoffConfig
    )

    if (!shouldUpdate) {
      return
    }

    // 调度后台更新
    this.updateScheduler.scheduleBackgroundUpdate(
      configKey,
      () => this.performBackgroundUpdate(configKey),
      this.updateOptions.backgroundUpdateTimeoutMs
    )
  }

  /**
   * 执行后台更新
   */
  private async performBackgroundUpdate(configKey: string): Promise<void> {
    // 记录更新尝试
    await this.persistentCache.recordUpdateAttempt(configKey)

    try {
      // 从数据库获取
      const data = await this.fetchFromDatabase(
        configKey,
        this.updateOptions.backgroundUpdateTimeoutMs
      )

      // 异步解密
      const decrypted = await this.decryptConfigAsync(data)

      // 更新缓存
      await this.updateAllCaches(configKey, decrypted)

      // 记录成功
      await this.persistentCache.recordUpdateSuccess(configKey)
    } catch (error) {
      // 后台更新失败不抛出错误
      console.warn(`[Config] 后台更新失败: ${configKey}`, error)
      throw error
    }
  }

  /**
   * 更新所有缓存（内存 + 持久化）
   */
  private async updateAllCaches(configKey: string, data: AppConfigData): Promise<void> {
    // 更新内存缓存
    this.setCacheEntry(configKey, {
      data,
      timestamp: Date.now(),
    })

    // 更新持久化缓存
    if (this.updateOptions.offlineFirst) {
      await this.persistentCache.set(configKey, data)
    }
  }

  /**
   * 手动批量后台更新
   */
  async updateInBackground(configKeys: string[]): Promise<void> {
    this.updateScheduler.scheduleBatchUpdate(
      configKeys,
      (configKey) => () => this.performBackgroundUpdate(configKey),
      this.updateOptions.backgroundUpdateTimeoutMs
    )
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
  async clearCache(configKey?: string): Promise<void> {
    if (configKey) {
      this.configCache.delete(configKey)
      await this.persistentCache.clearCache(configKey)
    } else {
      this.configCache.clear()
      await this.persistentCache.clearCache()
    }
  }

  /**
   * 获取缓存信息（调试用）
   */
  async getCacheInfo(configKey: string): Promise<{
    hasMemoryCache: boolean
    hasPersistentCache: boolean
    metadata: any
    dataSize: number
  }> {
    const memCache = this.configCache.get(configKey)
    const persistInfo = await this.persistentCache.getCacheInfo(configKey)

    return {
      hasMemoryCache: !!memCache,
      hasPersistentCache: persistInfo.hasCache,
      metadata: persistInfo.metadata,
      dataSize: persistInfo.dataSize,
    }
  }

  /**
   * 写入缓存，超出上限时清除最旧的条目
   */
  private setCacheEntry(key: string, value: { data: AppConfigData; timestamp: number }): void {
    if (this.configCache.size >= Config.MAX_CACHE_SIZE) {
      const firstKey = this.configCache.keys().next().value
      if (firstKey !== undefined) {
        this.configCache.delete(firstKey)
      }
    }
    this.configCache.set(key, value)
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.asyncCrypto.dispose()
  }
}
