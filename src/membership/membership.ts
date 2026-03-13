import { getSupabaseClient } from '../core/client';
import { configManager } from '../core/config';
import { queryWithTimeout } from '../config/timeout-controller';
import type { EventEmitter } from '../core/events';
import type { UserMembership } from '../core/types';
import type { CreateMembershipOptions, UpdateMembershipOptions, MembershipStatus } from './types';
import { MembershipError, MEMBERSHIP_ERROR_CODES } from './errors';

/**
 * 缓存条目
 */
interface CacheEntry {
  data: UserMembership | null;
  timestamp: number;
}

/**
 * 会员模块
 */
export class Membership {
  private membershipCache: Map<string, CacheEntry> = new Map();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟
  private static readonly MAX_CACHE_SIZE = 100;
  private static readonly DEFAULT_TIMEOUT = 5000; // 5秒

  constructor(private events: EventEmitter) {}

  /**
   * 获取用户会员信息
   * @param userId 用户 ID
   * @param options 选项
   * @returns 会员信息或 null
   */
  async getUserMembership(
    userId: string,
    options?: { useCache?: boolean; timeout?: number }
  ): Promise<UserMembership | null> {
    const useCache = options?.useCache ?? true;
    const timeout = options?.timeout ?? Membership.DEFAULT_TIMEOUT;

    // 检查缓存
    if (useCache) {
      const cached = this.membershipCache.get(userId);
      if (cached && Date.now() - cached.timestamp < Membership.CACHE_DURATION) {
        return cached.data;
      }
    }

    // 从数据库获取（带超时）
    const membership = await this.fetchMembershipWithTimeout(userId, timeout);

    // 写入缓存
    this.setCacheEntry(userId, { data: membership, timestamp: Date.now() });

    return membership;
  }

  /**
   * 从数据库获取会员信息（带超时）
   */
  private async fetchMembershipWithTimeout(
    userId: string,
    timeoutMs: number
  ): Promise<UserMembership | null> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      // 首先检查用户是否被封禁（带超时）
      const userResult = await queryWithTimeout(
        async () => {
          return await supabase
            .from('users')
            .select('is_banned')
            .eq('id', userId)
            .single()
        },
        timeoutMs
      );

      const { data: userData, error: userError } = userResult as any;

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

      // 获取会员信息（带超时）
      const result = await queryWithTimeout(
        async () => {
          return await supabase
            .from('user_app_memberships')
            .select('*')
            .eq('user_id', userId)
            .eq('application_id', config.appId)
            .single()
        },
        timeoutMs
      );

      const { data, error } = result as any;

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

      const trialDays = options?.trialDays ?? config.options?.trialDays ?? 7;
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('user_app_memberships')
        .insert({
          user_id: userId,
          application_id: config.appId,
          status: 'inactive',  // 数据库 CHECK 约束只允许 active/inactive/expired
          billing_cycle: options?.billingCycle || null,
          membership_plan_id: options?.membershipPlanId || null,
          started_at: now.toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
          metadata: options?.metadata || null,
        })
        .select()
        .single();

      if (error || !data) {
        // Postgres 唯一约束违反错误码为 23505，表示会员已存在，直接依赖 DB 约束避免竞态条件
        if (error?.code === '23505') {
          throw new MembershipError(
            '会员已存在',
            MEMBERSHIP_ERROR_CODES.ALREADY_EXISTS
          );
        }
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

      const updateData: Partial<{
        status: string;
        expires_at: string;
        billing_cycle: string;
        metadata: Record<string, unknown>;
        updated_at: string;
      }> = {
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
          status: 'inactive',  // 数据库 CHECK 约束不支持 'cancelled'，使用 'inactive' 代替
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

      // 清除缓存
      this.clearCache(userId);

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

  /**
   * 清除缓存
   * @param userId 用户 ID（可选，不传则清除所有）
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.membershipCache.delete(userId);
    } else {
      this.membershipCache.clear();
    }
  }

  /**
   * 强制刷新会员信息
   * @param userId 用户 ID
   * @returns 会员信息或 null
   */
  async refreshMembership(userId: string): Promise<UserMembership | null> {
    return this.getUserMembership(userId, { useCache: false });
  }

  /**
   * 预加载会员信息（登录后自动调用）
   * @param userId 用户 ID
   */
  async preloadMembership(userId: string): Promise<void> {
    try {
      await this.getUserMembership(userId);
    } catch (error) {
      console.warn('[Membership] 预加载会员信息失败:', error);
    }
  }

  /**
   * 批量获取会员信息
   * @param userIds 用户 ID 数组
   * @returns 用户 ID 到会员信息的映射
   */
  async getUserMemberships(userIds: string[]): Promise<Map<string, UserMembership | null>> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      // 批量查询
      const queryResult = await queryWithTimeout(
        async () => {
          return await supabase
            .from('user_app_memberships')
            .select('*')
            .in('user_id', userIds)
            .eq('application_id', config.appId)
        },
        Membership.DEFAULT_TIMEOUT
      );

      const { data, error } = queryResult as any;

      if (error) {
        throw new MembershipError(
          error.message,
          MEMBERSHIP_ERROR_CODES.GET_FAILED,
          error
        );
      }

      // 构建映射
      const result = new Map<string, UserMembership | null>();
      for (const userId of userIds) {
        const membership = data?.find((m: any) => m.user_id === userId) || null;
        result.set(userId, membership);

        // 写入缓存
        if (membership) {
          this.setCacheEntry(userId, { data: membership, timestamp: Date.now() });
        }
      }

      return result;
    } catch (error) {
      if (error instanceof MembershipError) throw error;
      throw new MembershipError(
        '批量获取会员信息失败',
        MEMBERSHIP_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 写入缓存，超出上限时清除最旧的条目（LRU 策略）
   */
  private setCacheEntry(userId: string, value: CacheEntry): void {
    if (this.membershipCache.size >= Membership.MAX_CACHE_SIZE) {
      // Map 的迭代顺序是插入顺序，删除第一个（最旧）条目
      const firstKey = this.membershipCache.keys().next().value;
      if (firstKey !== undefined) {
        this.membershipCache.delete(firstKey);
      }
    }
    this.membershipCache.set(userId, value);
  }
}
