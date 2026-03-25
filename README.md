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

### v1.0.5 (2026-03-25)

**支付模块重构与显示优化**

**💳 支付方式简化**
- 移除冗余支付方式：`wechat`、`stripe`、`manual`
- 仅支持三种支付方式：`alipay`（支付宝官方）、`wxpay`（微信官方）、`epay`（易支付）
- 新增具体配置类型：`AlipayConfig`、`WxpayConfig`、`EpayConfig`

**🎨 易支付显示优化**
- `PaymentChannelConfig` 新增 `display_method` 和 `display_name` 字段
- 易支付渠道自动转换为实际支付方式显示：
  - `epay` + `config.type='wxpay'` → `display_method='wxpay'`, `display_name='微信支付'`
  - `epay` + `config.type='alipay'` → `display_method='alipay'`, `display_name='支付宝'`
- `getPaymentChannel()` 和 `getPaymentChannels()` 自动应用显示优化

**🔧 类型安全提升**
- `PaymentMethod` 类型从 `'alipay' | 'wechat' | 'stripe' | 'manual' | 'epay'` 简化为 `'alipay' | 'wxpay' | 'epay'`
- 新增 `AlipayConfig` 接口：支付宝官方配置类型
- 新增 `WxpayConfig` 接口：微信官方配置类型
- 新增 `EpayConfig` 接口：易支付配置类型（支持 `type: 'alipay' | 'wxpay'`）

**✨ 用户体验改进**
- 前端无需额外处理，SDK 自动将易支付渠道显示为用户熟悉的"微信支付"或"支付宝"
- 保持底层数据结构统一（`payment_method='epay'`），同时提供用户友好的显示层

**⚠️ 破坏性变更**

| 变更项 | v1.0.4 | v1.0.5 |
|--------|--------|--------|
| `PaymentMethod` 类型 | 含 `'wechat'` \| `'stripe'` \| `'manual'` | 仅 `'alipay'` \| `'wxpay'` \| `'epay'` |

迁移：将代码中的 `'wechat'` → `'wxpay'`，移除 `'stripe'` 和 `'manual'` 的使用。

---

### v1.0.4 (2026-03-13)

**配置模块性能与离线体验全面升级**

**🚀 离线优先架构**
- 新增 `PersistentCacheManager`：持久化缓存管理器，缓存永不过期
- 新增 `UpdateScheduler`：智能后台更新调度，支持节流和指数退避策略
- 新增 `ConfigUpdateOptions`：灵活的配置更新策略（离线优先、节流时间、超时控制、重试策略）
- 默认策略：优先返回缓存，后台静默更新（24h 节流，1.2s 超时）

**⚡ 异步解密优化**
- 新增 `AsyncCrypto`：支持 Web Worker 异步解密（浏览器）和 setTimeout 分片（React Native）
- 新增 `getConfigAsync()`：完全异步的配置获取方法
- 新增 `batchGetConfigsAsync()`：批量异步获取配置
- 密钥派生和解密操作不再阻塞主线程

**⏱️ 超时控制**
- 新增 `TimeoutController`：统一的超时管理工具
- 新增 `TimeoutError` 类型和 `isTimeoutError()` 判断函数
- 支持手动更新和后台更新的独立超时配置

**📊 缓存元数据**
- 缓存元数据包含：时间戳、更新尝试次数、最后成功更新时间、版本号
- 支持 `getCacheInfo()` 查询缓存状态
- LRU 策略：内存缓存最多 100 条，持久化缓存无限制

**🔧 API 增强**
- `getConfig()` 新增选项：`forceRefresh`（强制刷新）、`fallbackValue`（降级默认值）、`timeout`（自定义超时）
- `Config` 构造函数支持 `ConfigUpdateOptions` 配置更新策略
- 导出 `TimeoutError` 和 `isTimeoutError` 供外部使用

**⚠️ 破坏性变更**

| 变更项 | v1.0.3 | v1.0.4 |
|--------|--------|--------|
| `Config` 构造函数 | `new Config(storage)` | `new Config(storage, updateOptions?)` |
| 默认行为 | 每次请求都查询数据库 | 优先返回缓存，后台更新 |

迁移：如需保持旧行为，传入 `{ offlineFirst: false }` 配置。

---

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
