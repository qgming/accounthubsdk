/**
 * 超时错误
 */
export class TimeoutError extends Error {
  constructor(message: string, public timeoutMs: number) {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * 为 Promise 添加超时控制
 * @param promise 原始 Promise
 * @param timeoutMs 超时时间（毫秒）
 * @param errorMessage 超时错误消息
 * @returns 带超时的 Promise
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new TimeoutError(
          errorMessage || `操作超时 (${timeoutMs}ms)`,
          timeoutMs
        )
      )
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    clearTimeout(timeoutId!)
    throw error
  }
}

/**
 * 为 Supabase 查询添加超时控制
 * @param queryFn 查询函数
 * @param timeoutMs 超时时间（毫秒）
 * @returns 带超时的查询结果
 */
export async function queryWithTimeout<T>(
  queryFn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return withTimeout(
    queryFn(),
    timeoutMs,
    `Supabase 查询超时 (${timeoutMs}ms)`
  )
}

/**
 * 检查错误是否为超时错误
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError
}
