import { configManager } from './core/config';
import { createSupabaseClient } from './core/client';
import { EventEmitter } from './core/events';
import { Auth } from './auth';
import { Membership } from './membership';
import { Payment } from './payment';
import { Update } from './update';
import { RedemptionManager } from './redemption/redemption';
import { Config } from './config';
import type { AccountHubConfig } from './core/types';

/**
 * AccountHub 主类（单例模式）
 */
export class AccountHub {
  private static instance: AccountHub | null = null;

  public readonly auth: Auth;
  public readonly membership: Membership;
  public readonly payment: Payment;
  public readonly update: Update;
  public readonly redemption: RedemptionManager;
  public readonly config: Config;
  public readonly events: EventEmitter;

  private constructor(config: AccountHubConfig) {
    // 初始化配置
    configManager.initialize(config);

    // 获取存储适配器
    const storage = configManager.getStorage();

    // 创建 Supabase 客户端（注入存储适配器）
    const supabase = createSupabaseClient(config.supabaseUrl, config.supabaseAnonKey, storage);

    // 创建事件发射器
    this.events = new EventEmitter();

    // 创建模块实例
    this.auth = new Auth(this.events);
    this.membership = new Membership(this.events);
    this.payment = new Payment(this.events);
    this.update = new Update(this.events);
    this.redemption = new RedemptionManager(supabase, config.appId);
    this.config = new Config();
  }

  /**
   * 初始化 AccountHub
   * @param config 配置对象
   * @returns AccountHub 实例
   * @throws {ConfigError} 如果配置无效
   */
  static initialize(config: AccountHubConfig): AccountHub {
    if (AccountHub.instance) {
      console.warn('AccountHub 已初始化。返回现有实例。');
      return AccountHub.instance;
    }

    AccountHub.instance = new AccountHub(config);
    return AccountHub.instance;
  }

  /**
   * 获取 AccountHub 实例
   * @returns AccountHub 实例
   * @throws {Error} 如果未初始化
   */
  static getInstance(): AccountHub {
    if (!AccountHub.instance) {
      throw new Error('AccountHub 未初始化。请先调用 AccountHub.initialize()');
    }
    return AccountHub.instance;
  }

  /**
   * 重置 AccountHub（主要用于测试）
   */
  static reset(): void {
    if (AccountHub.instance) {
      AccountHub.instance.events.clear();
      AccountHub.instance = null;
    }
    configManager.reset();
  }

  /**
   * 检查用户是否被封禁
   * @param userId 用户 ID
   * @returns 是否被封禁
   */
  async checkUserBanned(userId: string): Promise<boolean> {
    return this.auth.checkUserBanned(userId);
  }
}

/**
 * 便捷初始化函数
 * @param config 配置对象
 * @returns AccountHub 实例
 */
export function initializeAccountHub(config: AccountHubConfig): AccountHub {
  return AccountHub.initialize(config);
}
