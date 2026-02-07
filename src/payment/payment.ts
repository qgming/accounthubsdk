import { getSupabaseClient } from '../core/client';
import { configManager } from '../core/config';
import type { EventEmitter } from '../core/events';
import type {
  CheckoutSession,
  PaymentRecord,
  CreatePaymentOptions,
  MembershipPlan,
  PaymentMethod,
} from './types';
import { PaymentError, PAYMENT_ERROR_CODES } from './errors';

/**
 * 支付模块
 */
export class Payment {
  constructor(private events: EventEmitter) {}

  /**
   * 获取会员套餐列表
   * @returns 会员套餐列表
   */
  async getMembershipPlans(): Promise<MembershipPlan[]> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('application_id', config.appId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw new PaymentError(
          error.message,
          PAYMENT_ERROR_CODES.GET_FAILED,
          error
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        '获取会员套餐失败',
        PAYMENT_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 获取单个会员套餐
   * @param planId 套餐 ID
   * @returns 会员套餐
   */
  async getMembershipPlan(planId: string): Promise<MembershipPlan | null> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('application_id', config.appId)
        .eq('plan_id', planId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 未找到记录
        }
        throw new PaymentError(
          error.message,
          PAYMENT_ERROR_CODES.GET_FAILED,
          error
        );
      }

      return data;
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        '获取会员套餐详情失败',
        PAYMENT_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 创建支付记录
   * @param userId 用户 ID
   * @param options 创建选项
   * @returns 支付记录
   */
  async createPayment(
    userId: string,
    options: CreatePaymentOptions
  ): Promise<PaymentRecord> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      if (options.amount <= 0) {
        throw new PaymentError(
          '金额无效',
          PAYMENT_ERROR_CODES.INVALID_AMOUNT
        );
      }

      const { data, error } = await supabase
        .from('payment_history')
        .insert({
          user_id: userId,
          application_id: config.appId,
          membership_id: options.membershipId || null,
          amount: options.amount,
          currency: options.currency || 'CNY',
          payment_method: options.paymentMethod,
          status: 'pending',
          metadata: options.metadata || null,
        })
        .select()
        .single();

      if (error || !data) {
        throw new PaymentError(
          error?.message || '创建支付记录失败',
          PAYMENT_ERROR_CODES.CREATE_FAILED,
          error
        );
      }

      this.events.emit('payment:created', { paymentId: data.id });

      return data;
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        '创建支付记录失败',
        PAYMENT_ERROR_CODES.CREATE_FAILED,
        error
      );
    }
  }

  /**
   * 获取支付记录
   * @param paymentId 支付 ID
   * @returns 支付记录
   */
  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 未找到记录
        }
        throw new PaymentError(
          error.message,
          PAYMENT_ERROR_CODES.GET_FAILED,
          error
        );
      }

      return data;
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        '获取支付记录失败',
        PAYMENT_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 根据会话 ID 获取支付记录
   * @param sessionId 会话 ID
   * @returns 支付记录或 null
   */
  async getPaymentBySessionId(sessionId: string): Promise<PaymentRecord | null> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 未找到记录
        }
        throw new PaymentError(
          error.message,
          PAYMENT_ERROR_CODES.GET_FAILED,
          error
        );
      }

      return data;
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        '根据会话 ID 获取支付记录失败',
        PAYMENT_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 验证支付是否成功
   * @param sessionId 会话 ID
   * @returns 是否支付成功
   */
  async verifyPaymentBySessionId(sessionId: string): Promise<boolean> {
    const payment = await this.getPaymentBySessionId(sessionId);
    return payment !== null && payment.status === 'success';
  }

  /**
   * 获取用户支付历史
   * @param userId 用户 ID
   * @param limit 限制数量
   * @returns 支付记录列表
   */
  async getUserPayments(userId: string, limit = 10): Promise<PaymentRecord[]> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', userId)
        .eq('application_id', config.appId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new PaymentError(
          error.message,
          PAYMENT_ERROR_CODES.GET_FAILED,
          error
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        '获取用户支付历史失败',
        PAYMENT_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 获取支付渠道配置
   * @param channelId 渠道 ID
   * @returns 支付渠道配置
   */
  async getPaymentChannel(channelId: string): Promise<any> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('payment_configs')
        .select('*')
        .eq('id', channelId)
        .eq('is_active', true)
        .single();

      if (error) {
        throw new PaymentError(
          error.message,
          PAYMENT_ERROR_CODES.GET_FAILED,
          error
        );
      }

      return data;
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        '获取支付渠道失败',
        PAYMENT_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 获取应用的支付渠道列表
   * @param applicationId 应用 ID（可选，默认使用配置中的 appId）
   * @returns 支付渠道列表
   */
  async getPaymentChannels(applicationId?: string): Promise<any[]> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();
      const appId = applicationId || config.appId;

      const { data, error } = await supabase
        .from('payment_configs')
        .select('*')
        .eq('application_id', appId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        throw new PaymentError(
          error.message,
          PAYMENT_ERROR_CODES.GET_FAILED,
          error
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        '获取支付渠道列表失败',
        PAYMENT_ERROR_CODES.GET_FAILED,
        error
      );
    }
  }

  /**
   * 创建结账会话
   * @param userId 用户 ID
   * @param options 创建选项
   * @returns 结账会话
   */
  async createCheckoutSession(
    userId: string,
    options: CreatePaymentOptions
  ): Promise<CheckoutSession> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();
      const returnUrl = options.returnUrl || config.options?.defaultReturnUrl;

      if (!returnUrl) {
        throw new PaymentError(
          '结账会话需要回调 URL',
          PAYMENT_ERROR_CODES.CREATE_FAILED
        );
      }

      if (!options.channelId) {
        throw new PaymentError(
          '结账会话需要渠道 ID',
          PAYMENT_ERROR_CODES.CREATE_FAILED
        );
      }

      // 获取当前用户的认证 token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new PaymentError(
          '用户未认证',
          PAYMENT_ERROR_CODES.CREATE_FAILED
        );
      }

      // 调用 Edge Function 创建支付
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          userId,
          planId: options.metadata?.plan_id,
          appId: config.appId,
          returnUrl,
          channelId: options.channelId,
        },
      });

      if (error) {
        throw new PaymentError(
          error.message || '创建支付失败',
          PAYMENT_ERROR_CODES.CREATE_FAILED,
          error
        );
      }

      if (!data || !data.url) {
        throw new PaymentError(
          '支付服务返回的响应无效',
          PAYMENT_ERROR_CODES.CREATE_FAILED
        );
      }

      this.events.emit('payment:created', { paymentId: data.id });

      return {
        sessionId: data.id,
        paymentId: data.id,
        paymentUrl: data.url,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        '创建结账会话失败',
        PAYMENT_ERROR_CODES.CREATE_FAILED,
        error
      );
    }
  }

  /**
   * 为会员计划创建支付会话（便捷方法）
   * @param userId 用户 ID
   * @param planId 会员计划 ID
   * @param channelId 支付渠道 ID
   * @param options 额外选项
   * @returns 结账会话
   */
  async createMembershipCheckoutSession(
    userId: string,
    planId: string,
    channelId: string,
    options?: {
      returnUrl?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<CheckoutSession> {
    // 1. 获取会员计划信息
    const plan = await this.getMembershipPlan(planId);
    if (!plan) {
      throw new PaymentError('会员计划不存在', PAYMENT_ERROR_CODES.NOT_FOUND);
    }

    // 2. 获取支付渠道配置
    const channel = await this.getPaymentChannel(channelId);
    if (!channel) {
      throw new PaymentError('支付渠道不存在', PAYMENT_ERROR_CODES.CONFIG_NOT_FOUND);
    }

    // 3. 创建支付会话
    return this.createCheckoutSession(userId, {
      amount: plan.price,
      currency: plan.currency || 'CNY',
      paymentMethod: channel.payment_method as PaymentMethod,
      channelId: channelId,
      returnUrl: options?.returnUrl,
      metadata: {
        plan_id: plan.plan_id,
        planName: plan.display_name,
        ...options?.metadata,
      },
    });
  }
}

