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

// 获取配置选项
export interface GetConfigOptions {
  configKey: string
  useCache?: boolean      // 是否使用缓存，默认true
  cacheDuration?: number  // 缓存时长（毫秒），默认5分钟
}
