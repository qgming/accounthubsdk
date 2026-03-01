import type { SupabaseClient, FunctionsHttpError } from '@supabase/supabase-js'
import type { RedeemCodeResult, RedemptionCodeInfo, RedemptionCodeUse } from './types'
import { RedemptionError, RedemptionErrorCode } from './errors'

/**
 * 兑换码管理器
 */
export class RedemptionManager {
  private supabase: SupabaseClient
  private appId: string

  constructor(supabase: SupabaseClient, appId: string) {
    this.supabase = supabase
    this.appId = appId
  }

  /**
   * 解析 Edge Function 错误响应，返回 [errorCode, errorMessage]
   * 将三处重复的错误解析逻辑统一提取到此私有方法
   */
  private async parseEdgeFunctionError(
    error: FunctionsHttpError | Error,
    defaultMessage: string,
    defaultCode: RedemptionErrorCode
  ): Promise<[RedemptionErrorCode, string]> {
    let errorMessage = defaultMessage
    let errorCode = defaultCode

    // error.context 是 Response 对象，需要读取其响应体
    const errorObj = error as FunctionsHttpError
    if (errorObj.context && errorObj.context instanceof Response) {
      try {
        // 克隆 Response 以便读取（Response 只能读取一次）
        const responseClone = errorObj.context.clone()
        const errorData = await responseClone.json() as { error?: string }
        if (errorData && errorData.error) {
          errorMessage = errorData.error
        }
      } catch (e) {
        // 如果无法解析 JSON，使用默认错误消息
        console.error('Failed to parse error response:', e)
      }
    }

    // 根据错误消息映射到对应的错误码
    if (errorMessage.includes('不存在') || errorMessage.includes('应用不匹配')) {
      errorCode = RedemptionErrorCode.CODE_NOT_FOUND
      errorMessage = '兑换码不存在'
    } else if (errorMessage.includes('已过期')) {
      errorCode = RedemptionErrorCode.CODE_EXPIRED
    } else if (errorMessage.includes('已用完')) {
      errorCode = RedemptionErrorCode.CODE_EXHAUSTED
    } else if (errorMessage.includes('已禁用')) {
      errorCode = RedemptionErrorCode.CODE_DISABLED
    } else if (errorMessage.includes('已经使用')) {
      errorCode = RedemptionErrorCode.CODE_ALREADY_USED
    }

    return [errorCode, errorMessage]
  }

  /**
   * 将 data.error 字符串映射到错误码（success=false 时使用）
   */
  private mapDataErrorToCode(errorMessage: string): RedemptionErrorCode {
    if (errorMessage.includes('不存在') || errorMessage.includes('应用不匹配')) {
      return RedemptionErrorCode.CODE_NOT_FOUND
    } else if (errorMessage.includes('已过期')) {
      return RedemptionErrorCode.CODE_EXPIRED
    } else if (errorMessage.includes('已用完')) {
      return RedemptionErrorCode.CODE_EXHAUSTED
    } else if (errorMessage.includes('已禁用')) {
      return RedemptionErrorCode.CODE_DISABLED
    } else if (errorMessage.includes('已经使用')) {
      return RedemptionErrorCode.CODE_ALREADY_USED
    }
    return RedemptionErrorCode.REDEEM_FAILED
  }

  /**
   * 兑换码兑换
   * @param code 兑换码
   * @returns 兑换结果
   */
  async redeemCode(code: string): Promise<RedeemCodeResult> {
    try {
      // 检查用户是否已登录并刷新session
      const {
        data: { session },
        error: sessionError,
      } = await this.supabase.auth.getSession()

      if (sessionError || !session) {
        throw new RedemptionError(
          RedemptionErrorCode.USER_NOT_AUTHENTICATED,
          '用户未登录，请先登录'
        )
      }

      // 调用 Edge Function 进行兑换
      const { data, error } = await this.supabase.functions.invoke('redeem-code', {
        body: { code, applicationId: this.appId },
      })

      // 处理 HTTP 错误响应
      if (error) {
        const [errorCode, errorMessage] = await this.parseEdgeFunctionError(
          error,
          '兑换失败',
          RedemptionErrorCode.REDEEM_FAILED
        )
        throw new RedemptionError(errorCode, errorMessage, error)
      }

      // 处理业务逻辑错误（success=false）
      if (data && !data.success) {
        const errorMessage = data.error || '兑换失败'
        const errorCode = this.mapDataErrorToCode(errorMessage)
        throw new RedemptionError(
          errorCode,
          errorMessage.includes('应用不匹配') ? '兑换码不存在' : errorMessage
        )
      }

      return {
        success: true,
        message: data.message || '兑换成功',
        data: data.data
          ? {
              membershipId: data.data.membership_id,
              expiresAt: data.data.expires_at,
              planName: data.data.plan_name,
              durationDays: data.data.duration_days,
            }
          : undefined,
      }
    } catch (error) {
      if (error instanceof RedemptionError) {
        throw error
      }

      // 网络错误或其他未知错误
      throw new RedemptionError(
        RedemptionErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : '网络错误',
        error
      )
    }
  }

  /**
   * 验证兑换码（不实际兑换）
   * @param code 兑换码
   * @returns 兑换码信息
   */
  async validateCode(code: string): Promise<RedemptionCodeInfo> {
    try {
      // 检查用户是否已登录并刷新session
      const {
        data: { session },
        error: sessionError,
      } = await this.supabase.auth.getSession()

      if (sessionError || !session) {
        throw new RedemptionError(
          RedemptionErrorCode.USER_NOT_AUTHENTICATED,
          '用户未登录，请先登录'
        )
      }

      // 调用 Edge Function 验证兑换码（使用特殊参数表示只验证）
      const { data, error } = await this.supabase.functions.invoke('redeem-code', {
        body: { code, applicationId: this.appId, validateOnly: true },
      })

      // 处理 HTTP 错误响应
      if (error) {
        const [errorCode, errorMessage] = await this.parseEdgeFunctionError(
          error,
          '验证失败',
          RedemptionErrorCode.NETWORK_ERROR
        )
        throw new RedemptionError(errorCode, errorMessage, error)
      }

      // 处理业务逻辑错误（success=false）
      if (data && !data.success) {
        const errorMessage = data.error || '验证失败'
        const errorCode = this.mapDataErrorToCode(errorMessage)
        throw new RedemptionError(
          errorCode,
          errorMessage.includes('应用不匹配') ? '兑换码不存在' : errorMessage
        )
      }

      // 返回兑换码信息
      return data.data as RedemptionCodeInfo
    } catch (error) {
      if (error instanceof RedemptionError) {
        throw error
      }

      throw new RedemptionError(
        RedemptionErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : '网络错误',
        error
      )
    }
  }

  /**
   * 获取用户的兑换记录
   * @returns 兑换记录列表
   */
  async getUserRedemptions(): Promise<RedemptionCodeUse[]> {
    try {
      // 检查用户是否已登录
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new RedemptionError(
          RedemptionErrorCode.USER_NOT_AUTHENTICATED,
          '用户未登录，请先登录'
        )
      }

      // 查询用户的兑换记录
      const { data, error } = await this.supabase
        .from('redemption_code_uses')
        .select('*')
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return (data || []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        redemptionCodeId: item.redemption_code_id as string,
        userId: item.user_id as string,
        membershipId: item.membership_id as string | null,
        redeemedAt: item.redeemed_at as string,
        ipAddress: item.ip_address as string | null,
        userAgent: item.user_agent as string | null,
      }))
    } catch (error) {
      if (error instanceof RedemptionError) {
        throw error
      }

      throw new RedemptionError(
        RedemptionErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : '网络错误',
        error
      )
    }
  }
}
