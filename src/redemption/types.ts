// 兑换码信息接口
export interface RedemptionCodeInfo {
  code: string
  status: 'active' | 'expired' | 'exhausted' | 'disabled'
  planName: string
  durationDays: number
  price: number
  currency: string
  maxUses: number
  currentUses: number
  validFrom: string
  validUntil: string | null
}

// 兑换参数接口
export interface RedeemCodeParams {
  code: string
}

// 兑换结果接口
export interface RedeemCodeResult {
  success: boolean
  message: string
  data?: {
    membershipId: string
    expiresAt: string
    planName: string
    durationDays: number
  }
}

// 兑换记录接口
export interface RedemptionCodeUse {
  id: string
  redemptionCodeId: string
  userId: string
  membershipId: string | null
  redeemedAt: string
  ipAddress: string | null
  userAgent: string | null
}
