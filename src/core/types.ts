import type { User as SupabaseUser } from '@supabase/supabase-js';

// 导出 Supabase User 类型
export type User = SupabaseUser;

// 会员状态类型
export type MembershipStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'expired'
  | 'trial'
  | 'cancelled';

// 支付状态类型
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

// 付费周期类型
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

// 用户会员信息类型
export interface UserMembership {
  id: string;
  user_id: string;
  application_id: string;
  status: MembershipStatus;
  payment_status: PaymentStatus | null;
  billing_cycle: BillingCycle | null;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  membership_plan_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// 存储适配器接口
export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

// 配置接口
export interface AccountHubConfig {
  // Supabase 配置（2 个必需）
  supabaseUrl: string;
  supabaseAnonKey: string;

  // 应用配置（2 个必需）
  appId: string;
  appKey: string;

  // 可选配置
  options?: {
    trialDays?: number;              // 默认: 7
    autoCreateMembership?: boolean;  // 默认: false
    enablePasswordReset?: boolean;   // 默认: true
    storage?: StorageAdapter;        // 默认: WebStorage (localStorage)
    defaultReturnUrl?: string;       // 默认支付回调 URL（移动端必填）
  };
}
