// 主类和初始化函数
export { AccountHub, initializeAccountHub } from './accounthub';

// 配置
export type { AccountHubConfig, StorageAdapter } from './core/types';
export { ConfigError as CoreConfigError } from './core/config';

// Supabase 客户端
export { getSupabaseClient, createSupabaseClient } from './core/client';

// 存储抽象层
export { WebStorage, MemoryStorage, defaultStorage } from './core/storage';

// 认证模块
export { Auth } from './auth';
export type {
  SignUpData,
  SignInData,
  SignUpResult,
  SignInResult,
  VerifyOtpResult,
  UpdateProfileData,
} from './auth/types';
export { AuthError, AUTH_ERROR_CODES } from './auth/errors';

// 会员模块
export { Membership } from './membership';
export type {
  MembershipStatus,
  BillingCycle,
  CreateMembershipOptions,
  UpdateMembershipOptions,
} from './membership/types';
export type { UserMembership } from './core/types';
export { MembershipError, MEMBERSHIP_ERROR_CODES } from './membership/errors';

// 支付模块
export { Payment } from './payment';
export type {
  PaymentMethod,
  PaymentStatus,
  CheckoutSession,
  PaymentRecord,
  CreatePaymentOptions,
  MembershipPlan,
} from './payment/types';
export { PaymentError, PAYMENT_ERROR_CODES } from './payment/errors';

// 更新模块
export { Update } from './update';
export type {
  Platform,
  VersionInfo,
  UpdateCheckResult,
  CheckUpdateOptions,
  CachedUpdateInfo,
} from './update/types';
export { UpdateError, UPDATE_ERROR_CODES } from './update/errors';
export {
  compareVersions,
  isVersionGreater,
  isVersionLess,
  isVersionEqual,
  detectPlatform,
} from './update';

// 兑换码模块
export { RedemptionManager } from './redemption/redemption';
export type {
  RedemptionCodeInfo,
  RedeemCodeParams,
  RedeemCodeResult,
  RedemptionCodeUse,
} from './redemption/types';
export { RedemptionError, RedemptionErrorCode, REDEMPTION_ERROR_MESSAGES } from './redemption/errors';

// 配置模块
export { Config } from './config';
export { ConfigError, CONFIG_ERROR_CODES } from './config/errors';
export type { AppConfigData, AppConfigType, GetConfigOptions } from './config/types';

// 核心类型
export type { User } from './core/types';

// 事件系统
export type { EventType, EventPayload } from './core/events';
export { EventEmitter } from './core/events';
