# AccountHub SDK

<div align="center">

[![npm version](https://img.shields.io/npm/v/@accounthub/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@accounthub/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@accounthub/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@accounthub/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/qgming/accounthubsdk.svg?style=flat-square)](https://github.com/qgming/accounthubsdk/stargazers)

**企业级多应用账户管理 SDK — 为您的应用提供完整的用户、会员、支付和配置管理解决方案**

[快速开始](#-快速开始) • [核心功能](#-核心功能) • [API 文档](#-api-文档) • [框架集成](#-框架集成示例) • [更新日志](#-更新日志)

</div>

---

## 📖 关于 AccountHub

AccountHub SDK 是一个功能完整的 TypeScript SDK，配合 [AccountHub 管理后台](https://github.com/qgming/accounthub) 使用，为您的应用提供：

- 🔐 **用户认证系统** — 注册、登录、OTP 验证、密码管理
- 👥 **会员管理** — 会员创建、状态管理、自动续费
- 💳 **支付集成** — 支付记录、会员套餐、支付渠道
- 🔄 **版本更新** — 自动检查更新、版本比较、强制更新
- 🎟️ **兑换码系统** — 兑换码验证、兑换、使用记录
- ⚙️ **应用配置** — 动态配置获取、端到端加密、配置缓存

### 为什么选择 AccountHub？

- **统一管理** — 一个后台管理多个应用的用户、会员和支付
- **开箱即用** — 完整的功能模块，无需从零开发
- **类型安全** — 完整的 TypeScript 类型定义，消除 `any`
- **框架无关** — 支持 Vue、React、React Native 等任何 JavaScript 环境
- **安全可靠** — 配置数据 AES-256-GCM 端到端加密，基于 Supabase

---

## ✨ 核心功能

### 🔐 认证系统

- ✅ 用户注册与登录（邮箱/密码）
- ✅ OTP 邮箱验证
- ✅ 密码重置与更新
- ✅ 用户资料管理
- ✅ 认证状态监听
- ✅ 用户封禁检查

### 👥 会员管理

- ✅ 会员创建与状态管理
- ✅ 试用期配置
- ✅ 会员续费与取消
- ✅ 会员过期检查
- ✅ 灵活的计费周期（月付/年付）
- ✅ 会员状态：`active`（激活）、`inactive`（未激活）、`expired`（已过期）

### 💳 支付集成

- ✅ 支付记录创建与查询
- ✅ 会员套餐管理
- ✅ 支付历史追踪
- ✅ 多种支付方式支持（Stripe、支付宝、微信、易支付）
- ✅ 支付渠道配置查询（返回类型安全的 `PaymentChannelConfig`）
- ✅ 支付会话验证

### 🔄 版本更新

- ✅ 自动检查应用更新
- ✅ 版本号智能比较
- ✅ 强制更新支持
- ✅ 平台自动检测（Windows、macOS、Linux、iOS、Android）
- ✅ 更新缓存机制（带容量上限，防止内存泄漏）

### 🎟️ 兑换码系统

- ✅ 兑换码验证（不实际兑换）
- ✅ 兑换码兑换
- ✅ 获取用户兑换记录（完整类型定义）
- ✅ 支持单次/多次使用
- ✅ 自动检查过期和使用次数
- ✅ 精准的错误码映射

### ⚙️ 应用配置

- ✅ 动态配置获取
- ✅ **端到端 AES-256-GCM 加密**（v1.0.2 新增）
- ✅ 配置缓存机制（带容量上限，防止内存泄漏）
- ✅ 按类型获取配置列表
- ✅ 批量获取配置
- ✅ 支持多种配置类型（公告、API 配置、功能开关等）

### 🎯 技术特点

- **框架无关** — 支持 Vue、React、React Native 等任何 JavaScript 环境
- **类型安全** — 事件负载、方法返回值全面消除 `any`
- **模块化设计** — 按需使用各个功能模块
- **事件驱动** — 灵活的事件监听机制，负载类型安全
- **简单配置** — 仅需 4 个必填参数即可启动
- **单例模式** — 全局唯一实例，避免重复初始化

---

## 📦 安装

```bash
# npm
npm install @accounthub/sdk @supabase/supabase-js

# yarn
yarn add @accounthub/sdk @supabase/supabase-js

# pnpm
pnpm add @accounthub/sdk @supabase/supabase-js
```

> **注意**：`@supabase/supabase-js` 是必需的 peer dependency。

---

## 🚀 快速开始

### 第一步：获取配置信息

在使用 SDK 之前，需要从 [AccountHub 管理后台](https://github.com/qgming/accounthub) 获取：

1. **Supabase 配置**
   - `supabaseUrl`：Supabase 项目 URL
   - `supabaseAnonKey`：Supabase 匿名密钥

2. **AccountHub 配置**
   - `appId`：在 AccountHub 后台创建的应用 ID（UUID 格式）
   - `appKey`：应用密钥（格式：`ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 第二步：初始化 SDK

```typescript
import { initializeAccountHub } from "@accounthub/sdk";

const accountHub = initializeAccountHub({
  // Supabase 配置（必填）
  supabaseUrl: "https://your-project.supabase.co",
  supabaseAnonKey: "your-anon-key",

  // 应用配置（必填）
  appId: "your-app-uuid",
  appKey: "your-app-key",  // 同时用于配置数据的解密密钥

  // 可选配置
  options: {
    trialDays: 7,                    // 试用天数，默认 7
    autoCreateMembership: false,     // 注册后自动创建会员，默认 false
    enablePasswordReset: true,       // 启用密码重置，默认 true
    defaultReturnUrl: "https://...", // 默认支付回调 URL（移动端必填）
  },
});
```

> **提示**：建议使用环境变量管理敏感配置，参见[安全最佳实践](#-安全最佳实践)。

### 第三步：开始使用

```typescript
// 认证功能
await accountHub.auth.signIn({ email, password });

// 会员功能
const membership = await accountHub.membership.getUserMembership(userId);

// 支付功能
const plans = await accountHub.payment.getMembershipPlans();

// 更新功能
const updateInfo = await accountHub.update.checkUpdate({ currentVersion: "1.0.0" });

// 兑换码功能
const result = await accountHub.redemption.redeemCode("XXXX-XXXX-XXXX-XXXX");

// 配置功能（自动解密加密配置）
const config = await accountHub.config.getConfig("announcement");
```

---

## 📚 API 文档

### 认证模块 (Auth)

#### 用户注册

```typescript
const { user, needsVerification } = await accountHub.auth.signUp({
  email: "user@example.com",
  password: "password123",
  fullName: "张三",
});

if (needsVerification) {
  await accountHub.auth.verifyOtp("user@example.com", "123456", "张三");
}
```

#### 用户登录

```typescript
const { user, session } = await accountHub.auth.signIn({
  email: "user@example.com",
  password: "password123",
});
```

#### 获取当前用户

```typescript
const currentUser = await accountHub.auth.getCurrentUser();
// 返回: User | null
```

#### 用户登出

```typescript
await accountHub.auth.signOut();
```

#### 密码管理

```typescript
await accountHub.auth.updatePassword("newPassword123");
```

#### 更新用户资料

```typescript
await accountHub.auth.updateProfile({
  fullName: "李四",
  avatarUrl: "https://example.com/avatar.jpg",
});
```

#### 监听认证状态

```typescript
const unsubscribe = accountHub.auth.onAuthStateChange((user) => {
  if (user) {
    console.log("用户已登录:", user.email);
  } else {
    console.log("用户已登出");
  }
});

// 组件卸载时取消订阅
unsubscribe();
```

---

### 会员模块 (Membership)

#### 获取用户会员信息

```typescript
const membership = await accountHub.membership.getUserMembership(userId);
// 返回: UserMembership | null
```

#### 创建会员

```typescript
const newMembership = await accountHub.membership.createMembership(userId, {
  trialDays: 7,
  billingCycle: "monthly",   // 'monthly' | 'yearly'
  membershipPlanId: "plan-uuid",
  metadata: { source: "web" },
});
```

#### 更新会员状态

```typescript
// 快速更新状态
await accountHub.membership.updateMembershipStatus(userId, "active");
// 状态选项: 'active' | 'inactive' | 'expired'

// 更新完整会员信息
await accountHub.membership.updateMembership(userId, {
  status: "active",
  expiresAt: "2025-12-31T23:59:59Z",
  billingCycle: "yearly",
});
```

#### 取消会员

```typescript
await accountHub.membership.cancelMembership(userId);
```

#### 会员状态检查

```typescript
const isActive = await accountHub.membership.isMembershipActive(userId);
const expiryDate = await accountHub.membership.getMembershipExpiryDate(userId);
// 返回: Date | null
```

---

### 支付模块 (Payment)

#### 获取会员套餐

```typescript
const plans = await accountHub.payment.getMembershipPlans();
const plan = await accountHub.payment.getMembershipPlan("plan-id");
```

#### 创建支付会话（便捷方法）

```typescript
const session = await accountHub.payment.createMembershipCheckoutSession(
  userId,
  planId,
  channelId,
  {
    returnUrl: "myapp://payment-return",
    metadata: { source: "mobile" },
  },
);

console.log("会话 ID:", session.sessionId);
console.log("支付 ID:", session.paymentId);
console.log("支付链接:", session.paymentUrl);
```

#### 验证支付状态

```typescript
const isPaid = await accountHub.payment.verifyPaymentBySessionId(sessionId);

const payment = await accountHub.payment.getPaymentBySessionId(sessionId);
if (payment) {
  console.log("支付状态:", payment.status);
  console.log("支付金额:", payment.amount);
}
```

#### 查询支付渠道

```typescript
// 返回类型为 PaymentChannelConfig[]，不再是 any[]
const channels = await accountHub.payment.getPaymentChannels();

// 返回类型为 PaymentChannelConfig | null
const channel = await accountHub.payment.getPaymentChannel(channelId);
```

---

### 更新模块 (Update)

#### 检查更新

```typescript
const updateResult = await accountHub.update.checkUpdate({
  currentVersion: "1.0.0",
  cacheDuration: 5 * 60 * 1000,  // 缓存时长（毫秒），默认 5 分钟
});

if (updateResult.hasUpdate) {
  console.log("发现新版本:", updateResult.latestVersion?.version_number);
  console.log("是否强制更新:", updateResult.isForceUpdate);
  console.log("下载地址:", updateResult.latestVersion?.download_url);
}
```

#### 版本比较工具

```typescript
import { compareVersions, isVersionGreater, detectPlatform } from "@accounthub/sdk";

const result = compareVersions("1.2.0", "1.1.0");  // 1
const isNewer = isVersionGreater("2.0.0", "1.9.9"); // true
const platform = detectPlatform();
// 返回: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown'
```

#### 清除更新缓存

```typescript
accountHub.update.clearCache();
```

---

### 兑换码模块 (Redemption)

#### 兑换码兑换

```typescript
try {
  const result = await accountHub.redemption.redeemCode("XXXX-XXXX-XXXX-XXXX");

  if (result.success) {
    console.log("兑换成功:", result.message);
    console.log("会员 ID:", result.data?.membershipId);
    console.log("过期时间:", result.data?.expiresAt);
  }
} catch (error) {
  if (error instanceof RedemptionError) {
    console.error("兑换失败:", error.message, error.code);
  }
}
```

#### 验证兑换码（不实际兑换）

```typescript
// 返回类型为 RedemptionCodeInfo，不再是 any
const codeInfo = await accountHub.redemption.validateCode("XXXX-XXXX-XXXX-XXXX");
console.log("兑换码信息:", codeInfo);
```

#### 获取用户兑换记录

```typescript
// 返回类型为 RedemptionCodeUse[]，字段均有明确类型
const redemptions = await accountHub.redemption.getUserRedemptions();
```

#### 兑换码错误处理

```typescript
import { RedemptionError, RedemptionErrorCode } from "@accounthub/sdk";

try {
  await accountHub.redemption.redeemCode(code);
} catch (error) {
  if (error instanceof RedemptionError) {
    switch (error.code) {
      case RedemptionErrorCode.CODE_NOT_FOUND:
        console.error("兑换码不存在");
        break;
      case RedemptionErrorCode.CODE_EXPIRED:
        console.error("兑换码已过期");
        break;
      case RedemptionErrorCode.CODE_EXHAUSTED:
        console.error("兑换码已用完");
        break;
      case RedemptionErrorCode.CODE_ALREADY_USED:
        console.error("您已经使用过此兑换码");
        break;
      case RedemptionErrorCode.USER_NOT_AUTHENTICATED:
        console.error("请先登录");
        break;
    }
  }
}
```

---

### 配置模块 (Config)

配置模块支持端到端加密——管理后台使用应用密钥加密存储配置，SDK 在读取时自动解密，应用代码无需关心加密细节。

#### 获取配置

```typescript
// 根据 config_key 获取配置（加密数据自动解密）
const config = await accountHub.config.getConfig("announcement", {
  useCache: true,
  cacheDuration: 5 * 60 * 1000,
});

console.log("配置数据:", config.config_data);  // 已自动解密
```

#### 获取配置值

```typescript
const title = await accountHub.config.getConfigValue(
  "announcement",
  "title",
  "默认标题",  // 可选默认值
);

const configData = await accountHub.config.getConfigData("announcement");
```

#### 批量获取配置

```typescript
const configs = await accountHub.config.getConfigs([
  "announcement",
  "llm_config",
  "api_config",
]);
```

#### 按类型获取配置列表

```typescript
const announcements = await accountHub.config.getConfigsByType("announcement");
// 配置类型: 'announcement' | 'llm_config' | 'api_config' | 'feature_flag' | 'custom'
```

#### 清除配置缓存

```typescript
accountHub.config.clearCache("announcement");  // 清除特定配置缓存
accountHub.config.clearCache();                // 清除所有缓存
```

---

### 事件系统 (Events)

所有事件负载均有完整的 TypeScript 类型定义。

#### 认证事件

```typescript
accountHub.events.on("auth:signin", ({ userId }) => {
  console.log("用户登录:", userId);
});

accountHub.events.on("auth:signout", () => {
  console.log("用户已登出");
});

// user 类型为 User | null，不再是 any
accountHub.events.on("auth:statechange", ({ user }) => {
  console.log("认证状态变化:", user?.email);
});
```

#### 会员事件

```typescript
// membership 类型为 UserMembership，不再是 any
accountHub.events.on("membership:created", ({ membership }) => {
  console.log("会员创建:", membership.status);
});

accountHub.events.on("membership:updated", ({ membership }) => {
  console.log("会员更新:", membership.status);
});

accountHub.events.on("membership:cancelled", ({ membership }) => {
  console.log("会员取消:", membership.id);
});
```

#### 支付事件

```typescript
accountHub.events.on("payment:created", ({ paymentId }) => {
  console.log("支付创建:", paymentId);
});

accountHub.events.on("payment:completed", ({ paymentId }) => {
  console.log("支付完成:", paymentId);
});

accountHub.events.on("payment:failed", ({ paymentId, error }) => {
  console.log("支付失败:", paymentId, error);
});
```

#### 更新事件

```typescript
accountHub.events.on("update:available", ({ version }) => {
  console.log("发现新版本:", version);
});
```

---

## 🎨 框架集成示例

### React

```typescript
import { useState, useEffect } from 'react';
import { initializeAccountHub } from '@accounthub/sdk';

const accountHub = initializeAccountHub({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  appId: import.meta.env.VITE_APP_ID,
  appKey: import.meta.env.VITE_APP_KEY,
});

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountHub.auth.getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const unsubscribe = accountHub.auth.onAuthStateChange((newUser) => {
      setUser(newUser);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    signIn: (email: string, password: string) =>
      accountHub.auth.signIn({ email, password }),
    signOut: () => accountHub.auth.signOut(),
  };
}
```

### Vue 3

```typescript
import { ref, onMounted, onUnmounted } from "vue";
import { initializeAccountHub } from "@accounthub/sdk";

const accountHub = initializeAccountHub({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  appId: import.meta.env.VITE_APP_ID,
  appKey: import.meta.env.VITE_APP_KEY,
});

export function useAuth() {
  const user = ref(null);
  const loading = ref(true);
  let unsubscribe: (() => void) | null = null;

  onMounted(async () => {
    user.value = await accountHub.auth.getCurrentUser();
    loading.value = false;

    unsubscribe = accountHub.auth.onAuthStateChange((newUser) => {
      user.value = newUser;
    });
  });

  onUnmounted(() => {
    unsubscribe?.();
  });

  return {
    user,
    loading,
    signIn: (email: string, password: string) =>
      accountHub.auth.signIn({ email, password }),
    signOut: () => accountHub.auth.signOut(),
  };
}
```

### React Native

```typescript
import { initializeAccountHub } from "@accounthub/sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";

const accountHub = initializeAccountHub({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  appId: process.env.APP_ID!,
  appKey: process.env.APP_KEY!,
  options: {
    storage: {
      getItem: (key) => AsyncStorage.getItem(key),
      setItem: (key, value) => AsyncStorage.setItem(key, value),
      removeItem: (key) => AsyncStorage.removeItem(key),
    },
    defaultReturnUrl: "myapp://payment/callback",
  },
});
```

---

## 🔧 错误处理

```typescript
import {
  AuthError, AUTH_ERROR_CODES,
  MembershipError, MEMBERSHIP_ERROR_CODES,
  PaymentError, PAYMENT_ERROR_CODES,
  UpdateError, UPDATE_ERROR_CODES,
  RedemptionError, RedemptionErrorCode,
  ConfigError, CONFIG_ERROR_CODES,
} from "@accounthub/sdk";

try {
  await accountHub.auth.signIn({ email, password });
} catch (error) {
  if (error instanceof AuthError) {
    switch (error.code) {
      case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
        showError("邮箱或密码错误");
        break;
      case AUTH_ERROR_CODES.USER_BANNED:
        showError("账户已被封禁");
        break;
      case AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED:
        showError("请先验证邮箱");
        break;
    }
  }
}
```

---

## 🔒 安全最佳实践

### 1. 环境变量管理

```typescript
// ✅ 推荐
const accountHub = initializeAccountHub({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  appId: import.meta.env.VITE_APP_ID,
  appKey: import.meta.env.VITE_APP_KEY,
});

// ❌ 不推荐：硬编码
const accountHub = initializeAccountHub({
  supabaseUrl: "https://xxx.supabase.co",
  // ...
});
```

### 2. 事件监听清理

```typescript
// ✅ 推荐：记得取消订阅
useEffect(() => {
  const unsubscribe = accountHub.auth.onAuthStateChange((user) => {
    setUser(user);
  });
  return () => unsubscribe();
}, []);
```

### 3. 配置数据安全

`appKey` 同时作为配置数据的解密密钥。SDK 内部使用 `appKey + appId` 通过 PBKDF2-SHA256（10 万次迭代）派生 AES-256-GCM 加密密钥，派生结果在实例生命周期内缓存，避免重复计算。

---

## 📚 类型定义

### 会员状态

```typescript
// v1.0.2 变更：与数据库 CHECK 约束对齐，移除了 trial/suspended/cancelled
type MembershipStatus = "active" | "inactive" | "expired";
```

> ⚠️ **升级注意**：从 v1.x 升级时，若代码中使用了 `"trial"`、`"suspended"` 或 `"cancelled"` 状态值，需要迁移到对应的新值。详见 [v1.0.2 更新日志](#v102-2026-03-01)。

### 配置类型

```typescript
interface AccountHubConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appId: string;
  appKey: string;
  options?: {
    trialDays?: number;
    autoCreateMembership?: boolean;
    enablePasswordReset?: boolean;
    storage?: StorageAdapter;
    defaultReturnUrl?: string;
  };
}
```

### 支付渠道类型

```typescript
interface PaymentChannelConfig {
  id: string;
  application_id: string | null;
  payment_method: string;
  config: Record<string, unknown>;
  is_active: boolean | null;
  is_sandbox: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}
```

---

## 🏗️ 项目结构

```
accounthubsdk/
├── src/
│   ├── core/              # 核心模块
│   │   ├── client.ts      # Supabase 客户端
│   │   ├── config.ts      # 配置管理
│   │   ├── crypto.ts      # AES-256-GCM 加密工具（v1.0.2 新增）
│   │   ├── events.ts      # 事件系统（类型安全事件负载）
│   │   ├── storage.ts     # 存储适配器（含隐私模式保护）
│   │   └── types.ts       # 核心类型
│   ├── auth/              # 认证模块
│   ├── membership/        # 会员模块
│   ├── payment/           # 支付模块
│   ├── update/            # 更新模块
│   │   ├── version-compare.ts  # 版本比较算法
│   │   └── platform.ts         # 平台检测
│   ├── redemption/        # 兑换码模块
│   ├── config/            # 配置模块（支持端到端解密）
│   ├── accounthub.ts      # 主类（单例模式）
│   └── index.ts           # 主导出
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📝 更新日志

### v1.0.2 (2026-03-01)

**安全性与稳定性增强**

**🔐 配置端到端加密**
- 新增 `src/core/crypto.ts`：基于 `@noble/ciphers` 和 `@noble/hashes` 实现 AES-256-GCM 加密，使用 PBKDF2-SHA256（10 万次迭代）派生密钥
- `Config` 模块现在自动解密加密配置：管理后台写入的加密数据（`{ _enc: "enc:v1:..." }` 格式）在 SDK 读取时透明解密，应用代码无感知
- 派生密钥在 `Config` 实例内缓存，避免每次请求重复执行高开销的 PBKDF2 计算

**💾 缓存内存泄漏修复**
- `Config` 类新增 `MAX_CACHE_SIZE = 100` 上限，超出时自动淘汰最旧条目
- `Update` 类新增 `MAX_CACHE_SIZE = 50` 上限，同样采用 LRU 淘汰策略

**🏷️ 类型安全全面提升**
- `MembershipStatus` 与数据库 CHECK 约束对齐，调整为 `"active" | "inactive" | "expired"`（移除了 `"trial"` / `"suspended"` / `"cancelled"`）
- 事件负载 `auth:statechange` 中 `user` 类型从 `any` 改为 `User | null`
- 事件负载 `membership:created/updated/cancelled` 中 `membership` 类型从 `any` 改为 `UserMembership`
- `redemption.validateCode()` 返回类型从 `any` 改为 `RedemptionCodeInfo`
- `getUserRedemptions()` 返回的记录字段全部明确类型（消除 `any` 断言）
- `getPaymentChannel()` 返回类型从 `any` 改为 `PaymentChannelConfig | null`
- `getPaymentChannels()` 返回类型从 `any[]` 改为 `PaymentChannelConfig[]`
- `auth/types.ts` 中 `SignInResult.session` / `VerifyOtpResult.session` 从 `any` 改为 `Session`（来自 `@supabase/supabase-js`）
- `core/client.ts` 存储适配器从 `as any` 改为 `as SupportedStorage`

**🛡️ 存储健壮性**
- `WebStorage` 的 `getItem` / `setItem` / `removeItem` 全部包裹 try-catch，防止隐私模式或 SSR 环境下抛出未捕获异常

**🔄 兑换码错误处理重构**
- 提取私有方法 `parseEdgeFunctionError` 和 `mapDataErrorToCode`，消除三处重复的错误解析逻辑（约 90 行重复代码）
- 修复 Edge Function 错误响应的 JSON 解析类型安全问题

**🔧 会员逻辑修复**
- `createMembership` 移除创建前的预检查，改为依赖数据库唯一约束（PostgreSQL 错误码 `23505`）捕获重复会员，消除并发场景下的竞态条件
- `cancelMembership` 的状态值从 `"cancelled"` 修正为 `"inactive"`（与数据库 CHECK 约束一致）
- 初始会员状态从 `"trial"` 修正为 `"inactive"`（与数据库 CHECK 约束一致）

**⚠️ 破坏性变更**

| 变更 | v1.x | v1.0.2 |
|------|------|--------|
| `MembershipStatus` 移除的值 | `"trial"`, `"suspended"`, `"cancelled"` | 已移除，请使用 `"inactive"` 或 `"expired"` |

---

### v1.0.1 (2026-02-07)

**支付模块增强**

- ✨ 新增 `createMembershipCheckoutSession` 便捷方法，简化会员购买流程
- ✨ 新增 `getPaymentBySessionId`，支持通过会话 ID 查询支付记录
- ✨ 新增 `verifyPaymentBySessionId`，快速验证支付状态
- ✨ `CheckoutSession` 接口新增 `paymentId` 字段
- ✨ 导出 `PaymentChannelConfig` 类型

---

### v1.0.0 (2026-02-06)

- ✨ 初始版本发布
- 🔐 完整的认证功能
- 👥 会员管理功能
- 💳 支付集成功能
- 🔄 版本更新功能
- 🎟️ 兑换码系统
- ⚙️ 应用配置功能
- 🎪 事件驱动系统
- 📦 支持多种前端框架

---

## 🔗 相关链接

- [AccountHub 管理后台](https://github.com/qgming/accounthub)
- [Supabase 文档](https://supabase.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 💬 支持

如有问题，请通过提交 Issue 联系。

---

## 🙏 致谢

- [Supabase](https://supabase.com/) — 开源的 Firebase 替代方案
- [@noble/ciphers](https://github.com/paulmillr/noble-ciphers) — 高性能纯 TypeScript 加密库
- [@noble/hashes](https://github.com/paulmillr/noble-hashes) — 高性能纯 TypeScript 哈希库
- [TypeScript](https://www.typescriptlang.org/) — JavaScript 的超集
