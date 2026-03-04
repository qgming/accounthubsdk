// ===== 消息类型 =====

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

// 消息内容：纯文本或多模态内容块（含图片）
export type MessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } }
    >

export interface ChatMessage {
  role: MessageRole
  content: MessageContent
  name?: string
  /** tool result 消息时需要 */
  tool_call_id?: string
  /** assistant 消息携带的工具调用 */
  tool_calls?: ToolCall[]
}

// ===== Tool / Function Call =====

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description?: string
    /** JSON Schema */
    parameters: Record<string, unknown>
  }
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    /** JSON 字符串形式的参数 */
    arguments: string
  }
}

// ===== ChatOptions（完全兼容 OpenAI Chat Completions API） =====

export interface ChatOptions {
  /** 对话消息列表（必填） */
  messages: ChatMessage[]

  /** 覆盖配置中的默认模型 */
  model?: string

  /**
   * JSON / 结构化输出（直接透传 OpenAI 标准参数）
   * - json_object：JSON 对象模式
   * - json_schema：结构化输出（Structured Outputs）
   */
  response_format?:
    | { type: 'text' }
    | { type: 'json_object' }
    | {
        type: 'json_schema'
        json_schema: {
          name: string
          strict?: boolean
          schema: Record<string, unknown>
        }
      }

  // 采样参数
  temperature?: number
  top_p?: number
  max_tokens?: number
  max_completion_tokens?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]

  // Function Call / Tool Use
  tools?: ToolDefinition[]
  tool_choice?:
    | 'auto'
    | 'none'
    | 'required'
    | { type: 'function'; function: { name: string } }
  parallel_tool_calls?: boolean

  // 其他标准参数
  seed?: number
  /** 用于追踪，不影响输出 */
  user?: string

  /** 禁止外部传入，由 chatStream() 方法内部控制 */
  stream_options?: never
}

// ===== Chat 响应（标准 OpenAI 格式） =====

export interface ChatCompletion {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// ===== 流式响应 chunk（标准 OpenAI SSE 格式） =====

export interface ChatStreamChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: MessageRole
      content?: string
      tool_calls?: Array<{
        index: number
        id?: string
        type?: 'function'
        function?: {
          name?: string
          /** 参数的增量 JSON 片段 */
          arguments?: string
        }
      }>
    }
    finish_reason: string | null
  }>
  /** 仅在最后一个 chunk 中携带（需请求 stream_options.include_usage） */
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// ===== 语音转文字 =====

export interface STTOptions {
  /** ISO 639-1 语言代码，如 'zh'、'en' */
  language?: string
  /** 提示词，改善识别准确率 */
  prompt?: string
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
  temperature?: number
}

export interface STTResult {
  text: string
  language?: string
  duration?: number
  segments?: Array<{
    start: number
    end: number
    text: string
  }>
}

// ===== 图片生成 =====

export interface ImageGenOptions {
  n?: number
  size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  response_format?: 'url' | 'b64_json'
  model?: string
}

export interface ImageGenResult {
  created: number
  data: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}
