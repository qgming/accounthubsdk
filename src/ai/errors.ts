// AI 模块错误码
export const AI_ERROR_CODES = {
  PROXY_ERROR:       'AI_PROXY_ERROR',       // Edge Function 调用失败
  MODEL_NOT_FOUND:   'AI_MODEL_NOT_FOUND',   // model_key 不存在或未激活
  STREAM_ERROR:      'AI_STREAM_ERROR',      // 流式响应处理错误
  NOT_AUTHENTICATED: 'AI_NOT_AUTHENTICATED', // 用户未登录
  NETWORK_ERROR:     'AI_NETWORK_ERROR',     // 网络错误
  INVALID_PARAMS:    'AI_INVALID_PARAMS',    // 参数错误
} as const

export type AiErrorCode = typeof AI_ERROR_CODES[keyof typeof AI_ERROR_CODES]

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: AiErrorCode,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'AIError'
  }
}
