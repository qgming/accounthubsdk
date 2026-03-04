# AccountHub SDK

<div align="center">

[![npm version](https://img.shields.io/npm/v/@accounthub/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@accounthub/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@accounthub/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@accounthub/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

**企业级多应用账户管理 SDK**

配合 [AccountHub 管理后台](https://github.com/qgming/accounthub) 使用，为应用提供用户认证、会员管理、支付集成、版本更新、兑换码和应用配置功能。

</div>

---

## 安装

```bash
npm install @accounthub/sdk @supabase/supabase-js
```

> `@supabase/supabase-js` 为必需的 peer dependency。

---

## 快速开始

```typescript
import { initializeAccountHub } from "@accounthub/sdk";

const sdk = initializeAccountHub({
  supabaseUrl: "https://your-project.supabase.co",
  supabaseAnonKey: "your-anon-key",
  appId: "your-app-uuid",
  appKey: "your-app-key",
});

// 登录
const { user } = await sdk.auth.signIn({ email, password });

// 获取会员状态
const membership = await sdk.membership.getUserMembership(user.id);

// 获取配置（加密数据自动解密）
const config = await sdk.config.getConfig("announcement");

// 检查更新
const update = await sdk.update.checkUpdate({ currentVersion: "1.0.0" });

// AI 对话（需要部署 Supabase Edge Function: ai-proxy）
const ai = await sdk.ai.chat("getme-assistant", {
  messages: [{ role: "user", content: "你好，请用一句话介绍你自己。" }],
});
console.log(ai.choices[0]?.message?.content);

// 兑换码
await sdk.redemption.redeemCode("XXXX-XXXX-XXXX-XXXX");
```

---

## 文档

| 文档 | 内容 |
|------|------|
| [REFERENCE.md](docs/REFERENCE.md) | **AI 辅助编码用** — 完整类型定义、所有 API 签名速查、框架集成模板 |
| [api-auth.md](docs/api-auth.md) | 认证模块：注册、登录、OTP、资料管理、状态监听 |
| [api-membership.md](docs/api-membership.md) | 会员模块：创建、状态管理、过期检查、取消 |
| [api-payment.md](docs/api-payment.md) | 支付模块：套餐查询、会话创建、状态验证、渠道配置 |
| [api-config.md](docs/api-config.md) | 配置模块：读取、端到端解密、缓存管理 |
| [api-update.md](docs/api-update.md) | 更新模块：版本检查、平台检测、版本比较工具 |
| [api-ai.md](docs/api-ai.md) | AI 模块：对话（非流式/流式）、语音转文字、图片生成 |
| [api-redemption.md](docs/api-redemption.md) | 兑换码模块：验证、兑换、历史记录 |

---

## 框架支持

- **React** / **Next.js**
- **Vue 3** / **Nuxt**
- **React Native**
- 任何支持 TypeScript 的 JavaScript 环境

集成示例见 [REFERENCE.md — 框架集成模板](docs/REFERENCE.md#框架集成模板)。

---

## 更新日志

### v1.0.3 (2026-03-04)

- ✨ 新增 `AI` 模块：`chat` / `chatStream` / `speechToText` / `generateImage`
- ✨ Auth 新增 `trackActive()`：静默上报最近在线时间
- 🔧 顶层导出补齐 AI 相关类型与错误码

---

### v1.0.2 (2026-03-01)

**安全性与稳定性增强**

**🔐 配置端到端加密**
- 新增 `core/crypto.ts`：AES-256-GCM + PBKDF2-SHA256（10 万次迭代）密钥派生
- Config 模块自动解密 `{ _enc: "enc:v1:..." }` 格式的加密配置，应用代码无感知
- 派生密钥在实例生命周期内缓存，避免重复 PBKDF2 计算

**💾 缓存内存泄漏修复**
- `Config`：`MAX_CACHE_SIZE = 100`，超出时 LRU 淘汰
- `Update`：`MAX_CACHE_SIZE = 50`，超出时 LRU 淘汰

**🏷️ 类型安全全面提升**
- 事件负载 `auth:statechange`、`membership:*` 消除 `any`
- `getPaymentChannel/s()`、`validateCode()`、`getUserRedemptions()` 返回类型精确化
- `auth/types.ts`：`session` 从 `any` 改为 `Session`
- `core/client.ts`：存储适配器从 `as any` 改为 `as SupportedStorage`

**🛡️ 存储健壮性**
- `WebStorage` 所有方法添加 try-catch，防止隐私模式 / SSR 抛出未捕获异常

**🔄 兑换码错误处理重构**
- 提取 `parseEdgeFunctionError` 和 `mapDataErrorToCode` 私有方法，消除 ~90 行重复代码

**🔧 会员逻辑修复**
- `createMembership` 改为依赖数据库唯一约束（PostgreSQL 23505）消除竞态条件
- `cancelMembership` 状态从 `"cancelled"` 修正为 `"inactive"`（与 DB CHECK 约束一致）
- 初始会员状态从 `"trial"` 修正为 `"inactive"`

**⚠️ 破坏性变更**

| 变更项 | v1.x | v1.0.2 |
|--------|------|--------|
| `MembershipStatus` | 含 `"trial"` / `"suspended"` / `"cancelled"` | 仅 `"active"` \| `"inactive"` \| `"expired"` |

迁移：将代码中的 `"trial"` → `"inactive"`，`"cancelled"` → `"inactive"`，`"suspended"` → `"inactive"` 或 `"expired"`。

---

### v1.0.1 (2026-02-07)

- ✨ 新增 `createMembershipCheckoutSession` 便捷方法
- ✨ 新增 `getPaymentBySessionId` / `verifyPaymentBySessionId`
- ✨ `CheckoutSession` 新增 `paymentId` 字段
- ✨ 导出 `PaymentChannelConfig` 类型

---

### v1.0.0 (2026-02-06)

- 初始版本发布，包含认证、会员、支付、更新、兑换码、配置全部功能模块

---

## 相关链接

- [AccountHub 管理后台](https://github.com/qgming/accounthub)
- [Supabase 文档](https://supabase.com/docs)

---

## 许可证

MIT
