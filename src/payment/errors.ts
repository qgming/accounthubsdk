/**
 * 支付错误类
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// 错误代码常量
export const PAYMENT_ERROR_CODES = {
  CREATE_FAILED: 'CREATE_FAILED',
  GET_FAILED: 'GET_FAILED',
  VERIFY_FAILED: 'VERIFY_FAILED',
  REFUND_FAILED: 'REFUND_FAILED',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_METHOD: 'INVALID_METHOD',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_PAID: 'ALREADY_PAID',
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
} as const;
