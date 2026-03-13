import type { StorageAdapter } from '../core/types'
import type { AppConfigData } from './types'

/**
 * 缓存元数据
 */
export interface CacheMetadata {
  configKey: string
  timestamp: number              // 缓存时间戳
  lastUpdateAttempt: number      // 最后更新尝试时间
  updateAttempts: number         // 更新尝试次数
  lastSuccessfulUpdate: number   // 最后成功更新时间
  version: string                // 缓存版本
}

/**
 * 缓存条目
 */
interface CacheEntry {
  data: AppConfigData
  metadata: CacheMetadata
}

/**
 * 退避配置
 */
export interface BackoffConfig {
  initialDelayMs: number
  maxDelayMs: number
  multiplier: number
  maxRetries: number
}

/**
 * 持久化缓存管理器
 * 实现离线优先策略，缓存永不过期
 */
export class PersistentCacheManager {
  private storage: StorageAdapter
  private prefix: string
  private memoryCache: Map<string, CacheEntry> = new Map()
  private static readonly MAX_CACHE_SIZE = 100
  private static readonly CACHE_VERSION = '1.0'

  constructor(storage: StorageAdapter, prefix: string = 'accounthub_config_') {
    this.storage = storage
    this.prefix = prefix
  }

  /**
   * 获取缓存数据（优先内存，降级到持久化存储）
   */
  async get(configKey: string): Promise<CacheEntry | null> {
    // 1. 检查内存缓存
    const memCached = this.memoryCache.get(configKey)
    if (memCached) {
      return memCached
    }

    // 2. 检查持久化存储
    try {
      const dataKey = `${this.prefix}data:${configKey}`
      const metaKey = `${this.prefix}meta:${configKey}`

      const dataStr = await this.storage.getItem(dataKey)
      const metaStr = await this.storage.getItem(metaKey)

      if (!dataStr || !metaStr) {
        return null
      }

      const data = JSON.parse(dataStr) as AppConfigData
      const metadata = JSON.parse(metaStr) as CacheMetadata

      // 写入内存缓存
      const entry: CacheEntry = { data, metadata }
      this.setMemoryCache(configKey, entry)

      return entry
    } catch (error) {
      console.warn(`[CacheManager] 读取持久化缓存失败: ${configKey}`, error)
      return null
    }
  }

  /**
   * 设置缓存数据（同时写入内存和持久化存储）
   */
  async set(configKey: string, data: AppConfigData, metadata?: Partial<CacheMetadata>): Promise<void> {
    const now = Date.now()
    const fullMetadata: CacheMetadata = {
      configKey,
      timestamp: now,
      lastUpdateAttempt: now,
      updateAttempts: 0,
      lastSuccessfulUpdate: now,
      version: PersistentCacheManager.CACHE_VERSION,
      ...metadata,
    }

    const entry: CacheEntry = { data, metadata: fullMetadata }

    // 1. 写入内存缓存
    this.setMemoryCache(configKey, entry)

    // 2. 写入持久化存储
    try {
      const dataKey = `${this.prefix}data:${configKey}`
      const metaKey = `${this.prefix}meta:${configKey}`

      await this.storage.setItem(dataKey, JSON.stringify(data))
      await this.storage.setItem(metaKey, JSON.stringify(fullMetadata))
    } catch (error) {
      console.warn(`[CacheManager] 写入持久化缓存失败: ${configKey}`, error)
      // 持久化失败不影响内存缓存
    }
  }

  /**
   * 更新元数据（不更新数据本身）
   */
  async updateMetadata(configKey: string, updates: Partial<CacheMetadata>): Promise<void> {
    const entry = await this.get(configKey)
    if (!entry) {
      return
    }

    const newMetadata: CacheMetadata = {
      ...entry.metadata,
      ...updates,
    }

    const newEntry: CacheEntry = {
      data: entry.data,
      metadata: newMetadata,
    }

    // 更新内存缓存
    this.setMemoryCache(configKey, newEntry)

    // 更新持久化存储
    try {
      const metaKey = `${this.prefix}meta:${configKey}`
      await this.storage.setItem(metaKey, JSON.stringify(newMetadata))
    } catch (error) {
      console.warn(`[CacheManager] 更新元数据失败: ${configKey}`, error)
    }
  }

  /**
   * 检查是否应该更新（24h 节流）
   */
  shouldUpdate(metadata: CacheMetadata, throttleMs: number): boolean {
    const now = Date.now()
    const timeSinceLastSuccess = now - metadata.lastSuccessfulUpdate

    // 距离上次成功更新超过节流时间
    return timeSinceLastSuccess >= throttleMs
  }

  /**
   * 检查是否应该重试（退避策略）
   */
  shouldRetry(metadata: CacheMetadata, backoffConfig: BackoffConfig): boolean {
    const now = Date.now()

    // 超过最大重试次数
    if (metadata.updateAttempts >= backoffConfig.maxRetries) {
      return false
    }

    // 计算退避延迟
    const backoffDelay = Math.min(
      backoffConfig.initialDelayMs * Math.pow(backoffConfig.multiplier, metadata.updateAttempts),
      backoffConfig.maxDelayMs
    )

    const timeSinceLastAttempt = now - metadata.lastUpdateAttempt

    // 距离上次尝试超过退避延迟
    return timeSinceLastAttempt >= backoffDelay
  }

  /**
   * 记录更新尝试
   */
  async recordUpdateAttempt(configKey: string): Promise<void> {
    const entry = await this.get(configKey)
    if (!entry) {
      return
    }

    await this.updateMetadata(configKey, {
      lastUpdateAttempt: Date.now(),
      updateAttempts: entry.metadata.updateAttempts + 1,
    })
  }

  /**
   * 记录更新成功
   */
  async recordUpdateSuccess(configKey: string): Promise<void> {
    await this.updateMetadata(configKey, {
      lastSuccessfulUpdate: Date.now(),
      updateAttempts: 0, // 重置尝试次数
    })
  }

  /**
   * 清除缓存
   */
  async clearCache(configKey?: string): Promise<void> {
    if (configKey) {
      // 清除单个配置
      this.memoryCache.delete(configKey)

      try {
        const dataKey = `${this.prefix}data:${configKey}`
        const metaKey = `${this.prefix}meta:${configKey}`
        await this.storage.removeItem(dataKey)
        await this.storage.removeItem(metaKey)
      } catch (error) {
        console.warn(`[CacheManager] 清除持久化缓存失败: ${configKey}`, error)
      }
    } else {
      // 清除所有缓存
      this.memoryCache.clear()
      // 注意：无法清除所有持久化存储（需要遍历所有 key）
      console.warn('[CacheManager] 清除所有持久化缓存需要手动实现')
    }
  }

  /**
   * 获取缓存信息（调试用）
   */
  async getCacheInfo(configKey: string): Promise<{
    hasCache: boolean
    metadata: CacheMetadata | null
    dataSize: number
  }> {
    const entry = await this.get(configKey)

    if (!entry) {
      return {
        hasCache: false,
        metadata: null,
        dataSize: 0,
      }
    }

    const dataSize = JSON.stringify(entry.data).length

    return {
      hasCache: true,
      metadata: entry.metadata,
      dataSize,
    }
  }

  /**
   * 写入内存缓存（带 LRU 策略）
   */
  private setMemoryCache(key: string, value: CacheEntry): void {
    // 如果已存在，先删除（更新插入顺序）
    if (this.memoryCache.has(key)) {
      this.memoryCache.delete(key)
    }

    // 检查缓存大小限制
    if (this.memoryCache.size >= PersistentCacheManager.MAX_CACHE_SIZE) {
      // 删除最旧的条目（Map 的第一个元素）
      const firstKey = this.memoryCache.keys().next().value
      if (firstKey !== undefined) {
        this.memoryCache.delete(firstKey)
      }
    }

    // 插入新条目
    this.memoryCache.set(key, value)
  }
}
