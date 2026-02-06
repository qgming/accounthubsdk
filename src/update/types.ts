/**
 * 更新相关类型定义
 */

// 平台类型
export type Platform = 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'web' | 'unknown';

// 版本信息
export interface VersionInfo {
  id: string;
  application_id: string;
  version_number: string;
  version_code: number;
  release_notes: string | null;
  download_url: string | null;
  file_size: number | null;
  file_hash: string | null;
  min_supported_version: string | null;
  is_force_update: boolean | null;
  is_published: boolean | null;
  metadata: Record<string, any> | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// 更新检查结果
export interface UpdateCheckResult {
  hasUpdate: boolean;
  latestVersion: VersionInfo | null;
  currentVersion: string;
  isForceUpdate: boolean;
}

// 检查更新选项
export interface CheckUpdateOptions {
  currentVersion: string;
  platform?: Platform;
  cacheDuration?: number; // 缓存时长（毫秒），默认 5 分钟
}

// 缓存的更新信息
export interface CachedUpdateInfo {
  result: UpdateCheckResult;
  timestamp: number;
}
