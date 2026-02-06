/**
 * 更新错误类
 */
export class UpdateError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'UpdateError';
  }
}

// 错误代码常量
export const UPDATE_ERROR_CODES = {
  CHECK_FAILED: 'CHECK_FAILED',
  GET_FAILED: 'GET_FAILED',
  INVALID_VERSION: 'INVALID_VERSION',
  NO_PUBLISHED_VERSION: 'NO_PUBLISHED_VERSION',
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
} as const;
