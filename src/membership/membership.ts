import { getSupabaseClient } from '../core/client';
import { configManager } from '../core/config';
import type { EventEmitter } from '../core/events';
import type { UserMembership } from '../core/types';
import type { CreateMembershipOptions, UpdateMembershipOptions, MembershipStatus } from './types';
import { MembershipError, MEMBERSHIP_ERROR_CODES } from './errors';

/**
 * 会员模块
 */
export class Membership {
  constructor(private events: EventEmitter) {}

  /**
   * 获取用户会员信息
   * @param userId 用户 ID
   * @returns 会员信息或 null
   */
  async getUserMembership(userId: string): Promise<UserMembership | null> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      // 首先检查用户是否被封禁
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_banned')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new MembershipError(
          userError.message,
          MEMBERSHIP_ERROR_CODES.GET_FAILED,
          userError
        );
      }

      // 如果用户被封禁，返回 null
      if (userData?.is_banned === true) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_app_memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('application_id', config.appId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 未找到记录
        }
        throw new MembershipError(
          error.message,
          MEMBERSHIP_ERROR_CODES.GET_FAILED,
          error
        );
      }

      return data;
    } catch (error) {
      if (error instanceof MembershipError) throw error;
      throw new MembershipError(
        '获取用户会员信息失败',
        MEMBERSHIP_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 创建会员
   * @param userId 用户 ID
   * @param options 创建选项
   * @returns 创建的会员信息
   */
  async createMembership(
    userId: string,
    options?: CreateMembershipOptions
  ): Promise<UserMembership> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      // 检查是否已存在会员
      const existing = await this.getUserMembership(userId);
      if (existing) {
        throw new MembershipError(
          '会员已存在',
          MEMBERSHIP_ERROR_CODES.ALREADY_EXISTS
        );
      }

      const trialDays = options?.trialDays ?? config.options?.trialDays ?? 7;
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('user_app_memberships')
        .insert({
          user_id: userId,
          application_id: config.appId,
          status: 'trial',
          billing_cycle: options?.billingCycle || null,
          membership_plan_id: options?.membershipPlanId || null,
          started_at: now.toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
          metadata: options?.metadata || null,
        })
        .select()
        .single();

      if (error || !data) {
        throw new MembershipError(
          error?.message || '创建会员失败',
          MEMBERSHIP_ERROR_CODES.CREATE_FAILED,
          error
        );
      }

      this.events.emit('membership:created', { membership: data });

      return data;
    } catch (error) {
      if (error instanceof MembershipError) throw error;
      throw new MembershipError(
        '创建会员失败',
        MEMBERSHIP_ERROR_CODES.CREATE_FAILED,
        error
      );
    }
  }

  /**
   * 更新会员状态
   * @param userId 用户 ID
   * @param status 新状态
   * @returns 更新后的会员信息
   */
  async updateMembershipStatus(
    userId: string,
    status: MembershipStatus
  ): Promise<UserMembership> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      const { data, error } = await supabase
        .from('user_app_memberships')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('application_id', config.appId)
        .select()
        .single();

      if (error || !data) {
        throw new MembershipError(
          error?.message || '更新会员状态失败',
          MEMBERSHIP_ERROR_CODES.UPDATE_FAILED,
          error
        );
      }

      this.events.emit('membership:updated', { membership: data });

      return data;
    } catch (error) {
      if (error instanceof MembershipError) throw error;
      throw new MembershipError(
        '更新会员状态失败',
        MEMBERSHIP_ERROR_CODES.UPDATE_FAILED,
        error
      );
    }
  }

  /**
   * 更新会员信息
   * @param userId 用户 ID
   * @param options 更新选项
   * @returns 更新后的会员信息
   */
  async updateMembership(
    userId: string,
    options: UpdateMembershipOptions
  ): Promise<UserMembership> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (options.status) updateData.status = options.status;
      if (options.expiresAt) updateData.expires_at = options.expiresAt;
      if (options.billingCycle) updateData.billing_cycle = options.billingCycle;
      if (options.metadata) updateData.metadata = options.metadata;

      const { data, error } = await supabase
        .from('user_app_memberships')
        .update(updateData)
        .eq('user_id', userId)
        .eq('application_id', config.appId)
        .select()
        .single();

      if (error || !data) {
        throw new MembershipError(
          error?.message || '更新会员信息失败',
          MEMBERSHIP_ERROR_CODES.UPDATE_FAILED,
          error
        );
      }

      this.events.emit('membership:updated', { membership: data });

      return data;
    } catch (error) {
      if (error instanceof MembershipError) throw error;
      throw new MembershipError(
        '更新会员信息失败',
        MEMBERSHIP_ERROR_CODES.UPDATE_FAILED,
        error
      );
    }
  }

  /**
   * 取消会员
   * @param userId 用户 ID
   * @returns 更新后的会员信息
   */
  async cancelMembership(userId: string): Promise<UserMembership> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      const { data, error } = await supabase
        .from('user_app_memberships')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('application_id', config.appId)
        .select()
        .single();

      if (error || !data) {
        throw new MembershipError(
          error?.message || '取消会员失败',
          MEMBERSHIP_ERROR_CODES.CANCEL_FAILED,
          error
        );
      }

      this.events.emit('membership:cancelled', { membership: data });

      return data;
    } catch (error) {
      if (error instanceof MembershipError) throw error;
      throw new MembershipError(
        '取消会员失败',
        MEMBERSHIP_ERROR_CODES.CANCEL_FAILED,
        error
      );
    }
  }

  /**
   * 检查会员是否激活
   * @param userId 用户 ID
   * @returns 是否激活
   */
  async isMembershipActive(userId: string): Promise<boolean> {
    try {
      // 首先检查用户是否被封禁
      const supabase = getSupabaseClient();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_banned')
        .eq('id', userId)
        .single();

      // 如果用户被封禁，直接返回 false
      if (!userError && userData?.is_banned === true) {
        return false;
      }

      const membership = await this.getUserMembership(userId);
      if (!membership) return false;

      const now = new Date();
      const expiresAt = membership.expires_at ? new Date(membership.expires_at) : null;

      return (
        membership.status === 'active' &&
        (!expiresAt || expiresAt > now)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取会员过期日期
   * @param userId 用户 ID
   * @returns 过期日期或 null
   */
  async getMembershipExpiryDate(userId: string): Promise<Date | null> {
    try {
      const membership = await this.getUserMembership(userId);
      if (!membership || !membership.expires_at) return null;

      return new Date(membership.expires_at);
    } catch (error) {
      return null;
    }
  }
}
