# AI 模块 API

`accountHub.ai` — 通过 Supabase Edge Function 代理调用大模型能力，提供对话（非流式/流式）、语音转文字、图片生成。

---

## 前置条件

1. 在 Supabase 项目中部署名为 `ai-proxy` 的 Edge Function  
   SDK 会调用：`POST {supabaseUrl}/functions/v1/ai-proxy`
2. `initializeAccountHub({ appKey })` 中的 `appKey` 会随请求发送用于鉴权（请勿泄露）
3. `modelKey` 是管理后台 AI 模型配置中的 `model_key`（如 `getme-assistant`）

---

## 方法列表

### `chat(modelKey, options)`

对话补全（非流式，推荐使用，节省 Edge 资源）。

```typescript
import type { ChatMessage } from "@accounthub/sdk";

const messages: ChatMessage[] = [
  { role: "user", content: "你好，请用一句话介绍你自己。" },
];

const res = await accountHub.ai.chat("getme-assistant", { messages });
console.log(res.choices[0]?.message?.content);
```

**说明：**
- `options` 完全兼容 OpenAI Chat Completions API（如 `response_format`、`tools`、`tool_choice` 等）。

---

### `chatStream(modelKey, options)`

对话补全（流式），返回 `AsyncGenerator<ChatStreamChunk>`。

```typescript
import type { ChatMessage } from "@accounthub/sdk";

const messages: ChatMessage[] = [{ role: "user", content: "用 100 字介绍人工智能。" }];

let output = "";
for await (const chunk of accountHub.ai.chatStream("getme-assistant", { messages })) {
  const delta = chunk.choices[0]?.delta?.content ?? "";
  output += delta;
}

console.log(output);
```

**提示：**
- 流式响应按 chunk 增量返回，通常需要将 `delta.content` 逐段拼接。

---

### `speechToText(modelKey, audio, options?)`

语音转文字（Whisper 等）。`audio: Blob` 会被转为 base64 后通过 JSON 传输。

```typescript
// audio 示例：浏览器录音得到的 Blob（Web 端可能需要录音权限）
const result = await accountHub.ai.speechToText("whisper-main", audioBlob, {
  language: "zh",
});

console.log(result.text);
```

---

### `generateImage(modelKey, prompt, options?)`

图片生成（DALL·E 等）。

```typescript
const img = await accountHub.ai.generateImage("dalle-main", "A futuristic city with flying cars", {
  size: "1024x1024",
});

console.log(img.data[0]?.url);
```

**返回：** `ImageGenResult`，其中每个 `data` 元素可能包含：
- `url`：图片 URL（常用）
- `b64_json`：base64 内容（按模型/配置而定）

---

## 多模态消息（图片识别）

`ChatMessage.content` 支持 `image_url` 内容块：

```typescript
import type { ChatMessage } from "@accounthub/sdk";

const messages: ChatMessage[] = [
  {
    role: "user",
    content: [
      { type: "text", text: "这张图里有什么？" },
      { type: "image_url", image_url: { url: "https://example.com/image.png" } },
    ],
  },
];

const res = await accountHub.ai.chat("vision-main", { messages });
console.log(res.choices[0]?.message?.content);
```

---

## 错误码

```typescript
import { AIError, AI_ERROR_CODES } from "@accounthub/sdk";
```

- `AI_ERROR_CODES.NOT_AUTHENTICATED` — 未登录或鉴权失败（通常对应 401）
- `AI_ERROR_CODES.MODEL_NOT_FOUND` — `model_key` 不存在或未激活（通常对应 404）
- `AI_ERROR_CODES.NETWORK_ERROR` — 网络请求失败（fetch 异常等）
- `AI_ERROR_CODES.STREAM_ERROR` — 流式响应解析/处理错误
- `AI_ERROR_CODES.INVALID_PARAMS` — 参数错误（由代理服务返回或本地校验触发）
- `AI_ERROR_CODES.PROXY_ERROR` — 代理服务错误（其他非 2xx）

> 调用失败时会抛出 `AIError`（包含 `code` 字段），建议按错误码做降级处理。

