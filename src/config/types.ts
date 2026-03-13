// 配置类型
export type AppConfigType =
  | 'announcement'
  | 'llm_config'
  | 'api_config'
  | 'feature_flag'
  | 'custom'

// 配置接口
export interface AppConfigData {
  id: string
  config_key: string
  name: string
  description: string | null
  config_data: Record<string, any>
  config_type: AppConfigType | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// 配置更新策略选项
export interface ConfigUpdateOptions {
  offlineFirst?: boolean              // 离线优先，默认: true
  updateThrottleMs?: number           // 更新节流时间，默认: 24h
  backgroundUpdateTimeoutMs?: number  // 后台更新超时，默认: 1200ms
  manualUpdateTimeoutMs?: number      // 手动更新超时，默认: 10000ms
  retryBackoff?: {
    initialDelayMs?: number           // 初始延迟，默认: 1000ms
    maxDelayMs?: number               // 最大延迟，默认: 60000ms
    multiplier?: number               // 倍数，默认: 2
    maxRetries?: number               // 最大重试次数，默认: 5
  }
  useWorkerForDecryption?: boolean    // 使用 Worker 解密，默认: true
  persistentCachePrefix?: string      // 持久化缓存前缀，默认: 'accounthub_config_'
  storeDecryptedData?: boolean        // 存储解密后的数据，默认: true
}

// 获取配置选项
export interface GetConfigOptions {
  useCache?: boolean          // 是否使用缓存，默认true
  cacheDuration?: number      // 内存缓存时长（毫秒），默认5分钟
  forceRefresh?: boolean      // 强制刷新，忽略节流，默认false
  fallbackValue?: AppConfigData  // 降级默认值
  timeout?: number            // 自定义超时（覆盖默认值）
}
