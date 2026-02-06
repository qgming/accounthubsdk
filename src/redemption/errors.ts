// 兑换码错误代码
export enum RedemptionErrorCode {
  REDEEM_FAILED = 'REDEEM_FAILED',
  CODE_NOT_FOUND = 'CODE_NOT_FOUND',
  CODE_EXPIRED = 'CODE_EXPIRED',
  CODE_EXHAUSTED = 'CODE_EXHAUSTED',
  CODE_DISABLED = 'CODE_DISABLED',
  CODE_ALREADY_USED = 'CODE_ALREADY_USED',
  INVALID_APPLICATION = 'INVALID_APPLICATION',
  USER_NOT_AUTHENTICATED = 'USER_NOT_AUTHENTICATED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

// 兑换码错误类
export class RedemptionError extends Error {
  code: RedemptionErrorCode
  details?: any

  constructor(code: RedemptionErrorCode, message: string, details?: any) {
    super(message)
    this.name = 'RedemptionError'
    this.code = code
    this.details = details
  }
}

// 错误消息映射
export const REDEMPTION_ERROR_MESSAGES: Record<RedemptionErrorCode, string> = {
  [RedemptionErrorCode.REDEEM_FAILED]: '兑换失败',
  [RedemptionErrorCode.CODE_NOT_FOUND]: '兑换码不存在',
  [RedemptionErrorCode.CODE_EXPIRED]: '兑换码已过期',
  [RedemptionErrorCode.CODE_EXHAUSTED]: '兑换码已用完',
  [RedemptionErrorCode.CODE_DISABLED]: '兑换码已禁用',
  [RedemptionErrorCode.CODE_ALREADY_USED]: '您已经使用过此兑换码',
  [RedemptionErrorCode.INVALID_APPLICATION]: '应用不匹配',
  [RedemptionErrorCode.USER_NOT_AUTHENTICATED]: '用户未登录',
  [RedemptionErrorCode.NETWORK_ERROR]: '网络错误',
}
