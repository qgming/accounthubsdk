import { getSupabaseClient } from '../core/client';
import { configManager } from '../core/config';
import type { EventEmitter } from '../core/events';
import type {
  VersionInfo,
  UpdateCheckResult,
  CheckUpdateOptions,
  CachedUpdateInfo,
} from './types';
import { UpdateError, UPDATE_ERROR_CODES } from './errors';
import { isVersionGreater } from './version-compare';

/**
 * 更新模块
 */
export class Update {
  private updateCache: Map<string, CachedUpdateInfo> = new Map();

  constructor(private events: EventEmitter) {}

  /**
   * 检查更新
   * @param options 检查选项
   * @returns 更新检查结果
   */
  async checkUpdate(options: CheckUpdateOptions): Promise<UpdateCheckResult> {
    try {
      const config = configManager.getConfig();
      const cacheKey = `${config.appId}_${options.currentVersion}`;
      const cacheDuration = options.cacheDuration || 5 * 60 * 1000; // 默认 5 分钟

      // 检查缓存
      const cached = this.updateCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        return cached.result;
      }

      // 验证当前版本格式
      if (!this.isValidVersion(options.currentVersion)) {
        throw new UpdateError(
          '版本号格式无效',
          UPDATE_ERROR_CODES.INVALID_VERSION
        );
      }

      // 获取最新版本
      const latestVersion = await this.getLatestVersion();

      if (!latestVersion) {
        const result: UpdateCheckResult = {
          hasUpdate: false,
          latestVersion: null,
          currentVersion: options.currentVersion,
          isForceUpdate: false,
        };
        this.updateCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }

      // 比较版本
      const hasUpdate = isVersionGreater(
        latestVersion.version_number,
        options.currentVersion
      );

      const result: UpdateCheckResult = {
        hasUpdate,
        latestVersion,
        currentVersion: options.currentVersion,
        isForceUpdate: hasUpdate && (latestVersion.is_force_update || false),
      };

      // 缓存结果
      this.updateCache.set(cacheKey, { result, timestamp: Date.now() });

      // 触发事件
      if (hasUpdate) {
        this.events.emit('update:available', {
          version: latestVersion.version_number,
        });
      }

      return result;
    } catch (error) {
      if (error instanceof UpdateError) throw error;
      throw new UpdateError(
        '检查更新失败',
        UPDATE_ERROR_CODES.CHECK_FAILED,
        error
      );
    }
  }

  /**
   * 获取最新版本
   * @returns 最新版本信息
   */
  async getLatestVersion(): Promise<VersionInfo | null> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .eq('application_id', config.appId)
        .eq('is_published', true)
        .order('version_code', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 未找到记录
        }
        throw new UpdateError(
          error.message,
          UPDATE_ERROR_CODES.GET_FAILED,
          error
        );
      }

      return data;
    } catch (error) {
      if (error instanceof UpdateError) throw error;
      throw new UpdateError(
        '获取最新版本失败',
        UPDATE_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 获取所有已发布版本
   * @param limit 限制数量
   * @returns 版本列表
   */
  async getPublishedVersions(limit = 10): Promise<VersionInfo[]> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .eq('application_id', config.appId)
        .eq('is_published', true)
        .order('version_code', { ascending: false })
        .limit(limit);

      if (error) {
        throw new UpdateError(
          error.message,
          UPDATE_ERROR_CODES.GET_FAILED,
          error
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof UpdateError) throw error;
      throw new UpdateError(
        '获取已发布版本列表失败',
        UPDATE_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 获取特定版本信息
   * @param versionNumber 版本号
   * @returns 版本信息
   */
  async getVersion(versionNumber: string): Promise<VersionInfo | null> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .eq('application_id', config.appId)
        .eq('version_number', versionNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 未找到记录
        }
        throw new UpdateError(
          error.message,
          UPDATE_ERROR_CODES.GET_FAILED,
          error
        );
      }

      return data;
    } catch (error) {
      if (error instanceof UpdateError) throw error;
      throw new UpdateError(
        '获取版本信息失败',
        UPDATE_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 清除更新缓存
   */
  clearCache(): void {
    this.updateCache.clear();
  }

  /**
   * 验证版本号格式
   * @param version 版本号
   * @returns 是否有效
   */
  private isValidVersion(version: string): boolean {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    return versionRegex.test(version);
  }
}
