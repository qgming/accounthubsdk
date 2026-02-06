/**
 * 会员错误类
 */
export class MembershipError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'MembershipError';
  }
}

// 错误代码常量
export const MEMBERSHIP_ERROR_CODES = {
  CREATE_FAILED: 'CREATE_FAILED',
  UPDATE_FAILED: 'UPDATE_FAILED',
  GET_FAILED: 'GET_FAILED',
  CANCEL_FAILED: 'CANCEL_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_STATUS: 'INVALID_STATUS',
  EXPIRED: 'EXPIRED',
} as const;
