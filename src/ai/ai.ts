import { getSupabaseClient } from '../core/client'
import { configManager } from '../core/config'
import { AIError, AI_ERROR_CODES } from './errors'
import type {
  ChatOptions,
  ChatCompletion,
  ChatStreamChunk,
  STTOptions,
  STTResult,
  ImageGenOptions,
  ImageGenResult,
} from './types'

const FUNCTION_NAME = 'ai-proxy'

function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  // Prefer Node-compatible fast path when available (e.g. SSR / bundler polyfill)
  const maybeBuffer = (globalThis as unknown as { Buffer?: { from: (b: Uint8Array) => { toString: (enc: 'base64') => string } } }).Buffer
  if (maybeBuffer?.from) {
    return maybeBuffer.from(new Uint8Array(arrayBuffer)).toString('base64')
  }

  const bytes = new Uint8Array(arrayBuffer)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let output = ''

  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    const triple = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    output += alphabet[(triple >> 18) & 63]
    output += alphabet[(triple >> 12) & 63]
    output += alphabet[(triple >> 6) & 63]
    output += alphabet[triple & 63]
  }

  const remaining = bytes.length - i
  if (remaining === 1) {
    const triple = bytes[i] << 16
    output += alphabet[(triple >> 18) & 63]
    output += alphabet[(triple >> 12) & 63]
    output += '=='
  } else if (remaining === 2) {
    const triple = (bytes[i] << 16) | (bytes[i + 1] << 8)
    output += alphabet[(triple >> 18) & 63]
    output += alphabet[(triple >> 12) & 63]
    output += alphabet[(triple >> 6) & 63]
    output += '='
  }

  return output
}

/**
 * 解析 Edge Function 错误响应，转换为 AIError
 */
async function parseProxyError(response: Response): Promise<AIError> {
  try {
    const body = await response.json() as { error?: string }
    const msg = body.error ?? '代理服务错误'
    if (response.status === 401) {
      return new AIError(msg, AI_ERROR_CODES.NOT_AUTHENTICATED)
    }
    if (response.status === 404) {
      return new AIError(msg, AI_ERROR_CODES.MODEL_NOT_FOUND)
    }
    return new AIError(msg, AI_ERROR_CODES.PROXY_ERROR)
  } catch {
    return new AIError(`代理服务错误 (${response.status})`, AI_ERROR_CODES.PROXY_ERROR)
  }
}

/**
 * 获取 Edge Function 调用所需的 URL 和 app_key
 */
function getProxyConfig(): { url: string; appKey: string } {
  const supabase = getSupabaseClient()
  // supabase-js 内部属性（稳定存在于 v2）
  const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl
  const { appKey } = configManager.getConfig()
  return {
    url: `${supabaseUrl}/functions/v1/${FUNCTION_NAME}`,
    appKey,
  }
}

export class AI {
  // ── 内部：统一用原生 fetch 调用 Edge Function ─────────────────────────────
  // verify_jwt 已关闭，通过 app_key 在请求体中鉴权

  private async callProxy<T>(body: Record<string, unknown>): Promise<T> {
    const { url, appKey } = getProxyConfig()

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ app_key: appKey, ...body }),
      })
    } catch (err) {
      throw new AIError('网络请求失败', AI_ERROR_CODES.NETWORK_ERROR, err)
    }

    if (!response.ok) {
      throw await parseProxyError(response)
    }

    return response.json() as Promise<T>
  }

  // ── 非流式（主要使用，节省 Edge 资源） ──────────────────────────────────

  /**
   * 对话补全（非流式）
   *
   * 支持通过 ChatOptions 参数控制：
   * - 普通对话：messages 即可
   * - JSON 输出：response_format: { type: 'json_object' }
   * - 结构化输出：response_format: { type: 'json_schema', json_schema: {...} }
   * - Function Call：tools + tool_choice
   * - 图片识别：messages 中 content 使用 image_url 内容块
   */
  async chat(modelKey: string, options: ChatOptions): Promise<ChatCompletion> {
    return this.callProxy<ChatCompletion>({
      model_key: modelKey,
      request_type: 'chat',
      ...options,
    })
  }

  /**
   * 语音转文字（Whisper 等）
   * audio Blob 将被转换为 base64 后通过 JSON 传输
   */
  async speechToText(
    modelKey: string,
    audio: Blob,
    options?: STTOptions
  ): Promise<STTResult> {
    // Blob → base64
    const arrayBuffer = await audio.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)

    return this.callProxy<STTResult>({
      model_key: modelKey,
      request_type: 'speech_to_text',
      audio_base64: base64,
      audio_mime_type: audio.type || 'audio/webm',
      ...options,
    })
  }

  /**
   * 图片生成（DALL-E 等）
   */
  async generateImage(
    modelKey: string,
    prompt: string,
    options?: ImageGenOptions
  ): Promise<ImageGenResult> {
    return this.callProxy<ImageGenResult>({
      model_key: modelKey,
      request_type: 'image_gen',
      prompt,
      ...options,
    })
  }

  // ── 流式（按需使用） ─────────────────────────────────────────────────────

  /**
   * 对话补全（流式，返回 AsyncGenerator）
   *
   * 使用原生 fetch + ReadableStream 解析 SSE 格式。
   *
   * 使用示例：
   * ```ts
   * for await (const chunk of sdk.ai.chatStream('gpt4-main', { messages })) {
   *   const text = chunk.choices[0]?.delta?.content ?? ''
   *   process.stdout.write(text)
   * }
   * ```
   */
  async *chatStream(
    modelKey: string,
    options: ChatOptions
  ): AsyncGenerator<ChatStreamChunk> {
    const { url, appKey } = getProxyConfig()

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_key: appKey,
          model_key: modelKey,
          request_type: 'chat',
          stream: true,
          ...options,
        }),
      })
    } catch (err) {
      throw new AIError('网络请求失败', AI_ERROR_CODES.NETWORK_ERROR, err)
    }

    if (!response.ok) {
      throw await parseProxyError(response)
    }

    if (!response.body) {
      throw new AIError('响应体为空', AI_ERROR_CODES.STREAM_ERROR)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 解析 SSE 格式：每行 "data: {...}" 或 "data: [DONE]"
        const lines = buffer.split('\n')
        // 最后一个可能不完整，保留到下次
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const payload = trimmed.slice(6)
          if (payload === '[DONE]') return
          try {
            yield JSON.parse(payload) as ChatStreamChunk
          } catch {
            // 忽略无法解析的行（如心跳或注释行）
          }
        }
      }
    } catch (err) {
      if (err instanceof AIError) throw err
      throw new AIError('流式响应处理错误', AI_ERROR_CODES.STREAM_ERROR, err)
    } finally {
      reader.releaseLock()
    }
  }
}
