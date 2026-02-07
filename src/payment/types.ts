/**
 * 支付相关类型定义
 */

// 支付方式
export type PaymentMethod = 'alipay' | 'wechat' | 'stripe' | 'manual' | 'epay';

// 支付状态
export type PaymentStatus = 'success' | 'failed' | 'pending' | 'refunded';

// 支付渠道配置
export interface PaymentChannelConfig {
  id: string;
  application_id: string | null;
  payment_method: string;
  config: any;
  is_active: boolean | null;
  is_sandbox: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// 结账会话
export interface CheckoutSession {
  sessionId: string;
  paymentId: string;
  paymentUrl: string;
  expiresAt: string;
}

// 支付记录
export interface PaymentRecord {
  id: string;
  membership_id: string | null;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod | null;
  transaction_id: string | null;
  status: PaymentStatus;
  invoice_url: string | null;
  paid_at: string | null;
  created_at: string;
  application_id: string | null;
  metadata: Record<string, any> | null;
}

// 创建支付选项
export interface CreatePaymentOptions {
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  membershipId?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
  channelId?: string; // 支付渠道 ID
}

// 会员套餐
export interface MembershipPlan {
  id: string;
  application_id: string | null;
  plan_id: string;
  name: string;
  display_name: string;
  duration_days: number;
  price: number;
  currency: string | null;
  billing_cycle: string | null;
  description: string | null;
  features: Record<string, any> | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}
