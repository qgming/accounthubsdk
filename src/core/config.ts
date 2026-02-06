import type { AccountHubConfig } from './types';
import { defaultStorage, type StorageAdapter } from './storage';

// 配置错误类
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

// 配置管理器类（单例模式）
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AccountHubConfig | null = null;

  private constructor() {}

  /**
   * 获取配置管理器实例
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 初始化配置
   * @param config 配置对象
   */
  initialize(config: AccountHubConfig): void {
    this.validateConfig(config);
    this.config = {
      ...config,
      options: {
        trialDays: 7,
        autoCreateMembership: false,
        enablePasswordReset: true,
        storage: defaultStorage,
        defaultReturnUrl: undefined,
        ...config.options,
      },
    };
  }

  /**
   * 获取配置
   * @returns 配置对象
   * @throws {ConfigError} 如果配置未初始化
   */
  getConfig(): AccountHubConfig {
    if (!this.config) {
      throw new ConfigError('AccountHub 未初始化。请先调用 initializeAccountHub()');
    }
    return this.config;
  }

  /**
   * 验证配置
   * @param config 配置对象
   * @throws {ConfigError} 如果配置无效
   */
  private validateConfig(config: AccountHubConfig): void {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new ConfigError('Supabase URL 和 Anon Key 是必需的');
    }
    if (!config.appId || !config.appKey) {
      throw new ConfigError('App ID 和 App Key 是必需的');
    }

    // 验证 URL 格式
    try {
      new URL(config.supabaseUrl);
    } catch {
      throw new ConfigError('Supabase URL 格式无效');
    }

    // 验证 appId 格式（应该是 UUID）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(config.appId)) {
      throw new ConfigError('App ID 必须是有效的 UUID');
    }
  }

  /**
   * 重置配置（主要用于测试）
   */
  reset(): void {
    this.config = null;
  }

  /**
   * 获取存储适配器
   * @returns 存储适配器实例
   */
  getStorage(): StorageAdapter {
    const config = this.getConfig();
    return config.options?.storage || defaultStorage;
  }

  /**
   * 获取默认回调 URL
   * @returns 默认回调 URL（如果配置了）
   */
  getDefaultReturnUrl(): string | undefined {
    const config = this.getConfig();
    return config.options?.defaultReturnUrl;
  }
}

// 导出单例实例
export const configManager = ConfigManager.getInstance();
