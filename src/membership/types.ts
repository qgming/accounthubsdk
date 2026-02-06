/**
 * 会员相关类型定义
 */

import type { MembershipStatus, BillingCycle } from '../core/types';

// 创建会员选项
export interface CreateMembershipOptions {
  trialDays?: number;
  billingCycle?: BillingCycle;
  membershipPlanId?: string;
  metadata?: Record<string, any>;
}

// 更新会员选项
export interface UpdateMembershipOptions {
  status?: MembershipStatus;
  expiresAt?: string;
  billingCycle?: BillingCycle;
  metadata?: Record<string, any>;
}

export type { MembershipStatus, BillingCycle };
