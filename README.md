# AccountHub SDK

<div align="center">

[![npm version](https://img.shields.io/npm/v/@accounthub/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@accounthub/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@accounthub/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@accounthub/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/qgming/accounthubsdk.svg?style=flat-square)](https://github.com/qgming/accounthubsdk/stargazers)

**企业级多应用账户管理 SDK - 为您的应用提供完整的用户、会员、支付和配置管理解决方案**

[快速开始](#-快速开始) • [核心功能](#-核心功能) • [API 文档](#-api-文档) • [框架集成](#-框架集成示例)

</div>

---

## 📖 关于 AccountHub

AccountHub SDK 是一个功能完整的 TypeScript SDK，配合 [AccountHub 管理后台](https://github.com/qgming/accounthub) 使用，为您的应用提供：

- 🔐 **用户认证系统** - 注册、登录、OTP 验证、密码管理
- 👥 **会员管理** - 会员创建、状态管理、试用期、自动续费
- 💳 **支付集成** - 支付记录、会员套餐、支付历史
- 🔄 **版本更新** - 自动检查更新、版本比较、强制更新
- 🎟️ **兑换码系统** - 兑换码验证、兑换、使用记录
- ⚙️ **应用配置** - 动态配置管理、配置缓存

### 为什么选择 AccountHub？

- **统一管理** - 一个后台管理多个应用的用户、会员和支付
- **开箱即用** - 完整的功能模块，无需从零开发
- **类型安全** - 完整的 TypeScript 类型定义
- **框架无关** - 支持 Vue、React、React Native 等任何 JavaScript 环境
- **灵活扩展** - 模块化设计，按需使用
- **企业级** - 基于 Supabase，安全可靠

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
- ✅ 会员状态：激活、试用、过期、暂停、取消

### 💳 支付集成

- ✅ 支付记录创建与查询
- ✅ 会员套餐管理
- ✅ 支付历史追踪
- ✅ 多种支付方式支持（Stripe、支付宝、微信、易支付）
- ✅ 支付状态管理

### 🔄 版本更新

- ✅ 自动检查应用更新
- ✅ 版本号智能比较
- ✅ 强制更新支持
- ✅ 平台自动检测（Windows、macOS、Linux、iOS、Android）
- ✅ 更新缓存机制

### 🎟️ 兑换码系统

- ✅ 兑换码验证（不实际兑换）
- ✅ 兑换码兑换
- ✅ 获取用户兑换记录
- ✅ 支持单次/多次使用
- ✅ 自动检查过期和使用次数

### ⚙️ 应用配置

- ✅ 动态配置获取
- ✅ 配置缓存机制
- ✅ 按类型获取配置列表
- ✅ 批量获取配置
- ✅ 支持多种配置类型（公告、API 配置、功能开关等）

### 🎯 技术特点

- **框架无关** - 支持 Vue、React、React Native 等任何 JavaScript 环境
- **类型安全** - 完整的 TypeScript 类型定义
- **模块化设计** - 按需使用各个功能模块
- **事件驱动** - 灵活的事件监听机制
- **简单配置** - 仅需 4 个必填参数即可启动
- **单例模式** - 全局唯一实例，避免重复初始化

---

## 📦 安装

使用你喜欢的包管理器安装 SDK：

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

在使用 SDK 之前，你需要从 [AccountHub 管理后台](https://github.com/your-org/accounthub) 获取以下信息：

1. **Supabase 配置**
   - `supabaseUrl`: 你的 Supabase 项目 URL
   - `supabaseAnonKey`: Supabase 匿名密钥

2. **AccountHub 配置**
   - `appId`: 在 AccountHub 后台创建的应用 ID（UUID 格式）
   - `appKey`: 应用密钥（格式：`ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 第二步：初始化 SDK

```typescript
import { initializeAccountHub } from "@accounthub/sdk";

const accountHub = initializeAccountHub({
  // Supabase 配置（必填）
  supabaseUrl: "https://your-project.supabase.co",
  supabaseAnonKey: "your-anon-key",

  // 应用配置（必填）
  appId: "your-app-uuid",
  appKey: "your-app-key",

  // 可选配置
  options: {
    trialDays: 7, // 试用天数，默认 7
    autoCreateMembership: false, // 注册后自动创建会员，默认 false
    enablePasswordReset: true, // 启用密码重置，默认 true
    defaultReturnUrl: "https://...", // 默认支付回调 URL（移动端必填）
  },
});
```

> **提示**：建议使用环境变量管理敏感配置，参见[安全最佳实践](#-安全最佳实践)。

### 第三步：开始使用

初始化完成后，你可以通过 `accountHub` 实例访问所有功能模块：

```typescript
// 认证功能
await accountHub.auth.signIn({ email, password });

// 会员功能
const membership = await accountHub.membership.getUserMembership(userId);

// 支付功能
const plans = await accountHub.payment.getMembershipPlans();

// 更新功能
const updateInfo = await accountHub.update.checkUpdate({
  currentVersion: "1.0.0",
});

// 兑换码功能
const result = await accountHub.redemption.redeemCode("XXXX-XXXX-XXXX-XXXX");

// 配置功能
const config = await accountHub.config.getConfig("announcement");
```

---

## 📚 API 文档

### 认证模块 (Auth)

认证模块提供完整的用户认证功能，包括注册、登录、OTP 验证、密码管理等。

#### 用户注册

```typescript
const { user, needsVerification } = await accountHub.auth.signUp({
  email: "user@example.com",
  password: "password123",
  fullName: "John Doe",
});

// 如果需要邮箱验证
if (needsVerification) {
  await accountHub.auth.verifyOtp("user@example.com", "123456", "John Doe");
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
// 更新密码（需要已登录）
await accountHub.auth.updatePassword("newPassword123");
```

#### 更新用户资料

```typescript
await accountHub.auth.updateProfile({
  fullName: "Jane Doe",
  avatarUrl: "https://example.com/avatar.jpg",
});
```

#### 检查用户是否被封禁

```typescript
const isBanned = await accountHub.checkUserBanned(userId);
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

// 取消订阅
unsubscribe();
```

---

### 会员模块 (Membership)

会员模块提供完整的会员管理功能，支持试用期、多种计费周期和会员状态管理。

#### 获取用户会员信息

```typescript
const membership = await accountHub.membership.getUserMembership(userId);
// 返回: Membership | null
```

#### 创建会员

```typescript
const newMembership = await accountHub.membership.createMembership(userId, {
  trialDays: 7, // 试用天数
  billingCycle: "monthly", // 计费周期: 'monthly' | 'yearly'
  membershipPlanId: "plan-uuid", // 会员套餐 ID
  metadata: { source: "web" }, // 自定义元数据
});
```

#### 更新会员状态

```typescript
// 快速更新状态
await accountHub.membership.updateMembershipStatus(userId, "active");
// 状态选项: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial'

// 更新完整会员信息
await accountHub.membership.updateMembership(userId, {
  status: "active",
  expiresAt: "2024-12-31T23:59:59Z",
  billingCycle: "yearly",
});
```

#### 取消会员

```typescript
await accountHub.membership.cancelMembership(userId);
```

#### 会员状态检查

```typescript
// 检查会员是否激活
const isActive = await accountHub.membership.isMembershipActive(userId);

// 获取会员过期日期
const expiryDate = await accountHub.membership.getMembershipExpiryDate(userId);
// 返回: Date | null
```

---

### 支付模块 (Payment)

支付模块提供支付记录管理和会员套餐查询功能。

#### 获取会员套餐

```typescript
// 获取所有套餐
const plans = await accountHub.payment.getMembershipPlans();

// 获取单个套餐
const plan = await accountHub.payment.getMembershipPlan("plan-id");
```

#### 创建支付会话（便捷方法）⭐ 新增

```typescript
// 为会员计划创建支付会话（推荐使用）
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
console.log("过期时间:", session.expiresAt);
```

#### 创建支付会话（完整方法）

```typescript
// 获取支付渠道列表
const channels = await accountHub.payment.getPaymentChannels();

// 获取单个支付渠道
const channel = await accountHub.payment.getPaymentChannel(channelId);

// 创建支付会话
const session = await accountHub.payment.createCheckoutSession(userId, {
  amount: 99.0,
  currency: "CNY",
  paymentMethod: "alipay",
  channelId: channelId,
  returnUrl: "myapp://payment-return",
  metadata: { plan_id: planId },
});
```

#### 验证支付状态 ⭐ 新增

```typescript
// 根据会话 ID 验证支付是否成功
const isPaid = await accountHub.payment.verifyPaymentBySessionId(sessionId);

if (isPaid) {
  console.log("支付成功！");
  // 更新 UI 或跳转到成功页面
}

// 获取完整的支付记录
const payment = await accountHub.payment.getPaymentBySessionId(sessionId);
if (payment) {
  console.log("支付状态:", payment.status);
  console.log("支付金额:", payment.amount);
  console.log("支付时间:", payment.paid_at);
}
```

#### 创建支付记录

```typescript
const payment = await accountHub.payment.createPayment(userId, {
  amount: 99.0, // 支付金额
  currency: "CNY", // 货币类型
  paymentMethod: "alipay", // 支付方式: 'stripe' | 'alipay' | 'wechat' | 'epay' | 'manual'
  membershipId: "membership-uuid", // 关联的会员 ID
  metadata: { orderId: "12345" }, // 自定义元数据
});
```

#### 查询支付记录

```typescript
// 获取单个支付记录
const paymentRecord = await accountHub.payment.getPayment(paymentId);

// 获取用户支付历史
const payments = await accountHub.payment.getUserPayments(userId, 10);
// 参数: userId, limit (默认 10)
```

---

### 更新模块 (Update)

更新模块提供应用版本检查和更新管理功能。

#### 检查更新

```typescript
const updateResult = await accountHub.update.checkUpdate({
  currentVersion: "1.0.0", // 当前版本号
  platform: "windows", // 可选，自动检测
  cacheDuration: 5 * 60 * 1000, // 缓存时长（毫秒），默认 5 分钟
});

if (updateResult.hasUpdate) {
  console.log("发现新版本:", updateResult.latestVersion?.version_number);
  console.log("是否强制更新:", updateResult.isForceUpdate);
  console.log("下载地址:", updateResult.latestVersion?.download_url);
  console.log("更新说明:", updateResult.latestVersion?.release_notes);
}
```

#### 获取版本信息

```typescript
// 获取最新版本
const latestVersion = await accountHub.update.getLatestVersion();

// 获取所有已发布版本
const versions = await accountHub.update.getPublishedVersions(10);

// 获取特定版本信息
const version = await accountHub.update.getVersion("1.2.0");
```

#### 版本比较工具

```typescript
import {
  compareVersions,
  isVersionGreater,
  detectPlatform,
} from "@accounthub/sdk";

// 比较版本号
const result = compareVersions("1.2.0", "1.1.0");
// 返回: 1 (第一个版本更大), 0 (相等), -1 (第二个版本更大)

// 检查版本是否更新
const isNewer = isVersionGreater("2.0.0", "1.9.9"); // true

// 检测当前平台
const platform = detectPlatform();
// 返回: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown'
```

#### 清除更新缓存

```typescript
accountHub.update.clearCache();
```

---

### 兑换码模块 (Redemption)

兑换码模块提供兑换码验证、兑换和使用记录查询功能。

#### 兑换码兑换

```typescript
try {
  const result = await accountHub.redemption.redeemCode("XXXX-XXXX-XXXX-XXXX");

  if (result.success) {
    console.log("兑换成功:", result.message);
    console.log("会员 ID:", result.data?.membershipId);
    console.log("过期时间:", result.data?.expiresAt);
    console.log("套餐名称:", result.data?.planName);
    console.log("时长（天）:", result.data?.durationDays);
  }
} catch (error) {
  if (error instanceof RedemptionError) {
    console.error("兑换失败:", error.message, error.code);
  }
}
```

#### 验证兑换码（不实际兑换）

```typescript
try {
  const codeInfo = await accountHub.redemption.validateCode(
    "XXXX-XXXX-XXXX-XXXX",
  );
  console.log("兑换码信息:", codeInfo);
} catch (error) {
  console.error("验证失败:", error.message);
}
```

#### 获取用户兑换记录

```typescript
const redemptions = await accountHub.redemption.getUserRedemptions();
// 返回用户的所有兑换记录
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

配置模块提供动态应用配置管理功能，支持配置缓存和多种配置类型。

#### 获取配置

```typescript
// 根据 config_key 获取配置
const config = await accountHub.config.getConfig("announcement", {
  useCache: true, // 是否使用缓存，默认 true
  cacheDuration: 5 * 60 * 1000, // 缓存时长（毫秒），默认 5 分钟
});

console.log("配置类型:", config.config_type);
console.log("配置数据:", config.config_data);
```

#### 获取配置值

```typescript
// 获取配置的特定字段值
const title = await accountHub.config.getConfigValue(
  "announcement",
  "title",
  "默认标题",
);
// 参数: configKey, fieldKey, defaultValue（可选）

// 获取配置的所有数据
const configData = await accountHub.config.getConfigData("announcement");
```

#### 批量获取配置

```typescript
// 批量获取多个配置
const configs = await accountHub.config.getConfigs([
  "announcement",
  "llm_config",
  "api_config",
]);
```

#### 按类型获取配置列表

```typescript
// 获取特定类型的所有配置
const announcements = await accountHub.config.getConfigsByType("announcement");
// 配置类型: 'announcement' | 'llm_config' | 'api_config' | 'feature_flag' | 'custom'
```

#### 清除配置缓存

```typescript
// 清除特定配置的缓存
accountHub.config.clearCache("announcement");

// 清除所有配置缓存
accountHub.config.clearCache();
```

---

### 事件系统 (Events)

SDK 提供了完整的事件监听机制，让你能够响应各种业务事件。

#### 认证事件

```typescript
// 用户登录
accountHub.events.on("auth:signin", ({ userId }) => {
  console.log("用户登录:", userId);
});

// 用户登出
accountHub.events.on("auth:signout", () => {
  console.log("用户登出");
});

// 认证状态变化
accountHub.events.on("auth:statechange", ({ user }) => {
  console.log("认证状态变化:", user);
});
```

#### 会员事件

```typescript
// 会员创建
accountHub.events.on("membership:created", ({ membership }) => {
  console.log("会员创建:", membership);
});

// 会员更新
accountHub.events.on("membership:updated", ({ membership }) => {
  console.log("会员更新:", membership);
});

// 会员取消
accountHub.events.on("membership:cancelled", ({ membership }) => {
  console.log("会员取消:", membership);
});
```

#### 支付事件

```typescript
// 支付创建
accountHub.events.on("payment:created", ({ paymentId }) => {
  console.log("支付创建:", paymentId);
});

// 支付完成
accountHub.events.on("payment:completed", ({ paymentId }) => {
  console.log("支付完成:", paymentId);
});

// 支付失败
accountHub.events.on("payment:failed", ({ paymentId, error }) => {
  console.log("支付失败:", paymentId, error);
});
```

#### 更新事件

```typescript
// 发现新版本
accountHub.events.on("update:available", ({ version }) => {
  console.log("发现新版本:", version);
});

// 版本下载完成
accountHub.events.on("update:downloaded", ({ version }) => {
  console.log("版本下载完成:", version);
});
```

---

## 🎨 框架集成示例

### React

```typescript
import { useState, useEffect } from 'react';
import { initializeAccountHub } from '@accounthub/sdk';

// 初始化 SDK
const accountHub = initializeAccountHub({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  appId: import.meta.env.VITE_APP_ID,
  appKey: import.meta.env.VITE_APP_KEY,
});

// 自定义 Hook
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取当前用户
    accountHub.auth.getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // 监听认证状态变化
    const unsubscribe = accountHub.auth.onAuthStateChange((newUser) => {
      setUser(newUser);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await accountHub.auth.signIn({ email, password });
  };

  const signOut = async () => {
    await accountHub.auth.signOut();
  };

  return { user, loading, signIn, signOut };
}

// 使用示例
function App() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>加载中...</div>;

  if (!user) {
    return (
      <button onClick={() => signIn('user@example.com', 'password')}>
        登录
      </button>
    );
  }

  return (
    <div>
      <h1>欢迎, {user.email}</h1>
      <button onClick={signOut}>登出</button>
    </div>
  );
}
```

### Vue 3

```typescript
import { ref, onMounted, onUnmounted } from "vue";
import { initializeAccountHub } from "@accounthub/sdk";

// 初始化 SDK
const accountHub = initializeAccountHub({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  appId: import.meta.env.VITE_APP_ID,
  appKey: import.meta.env.VITE_APP_KEY,
});

// Composable
export function useAuth() {
  const user = ref(null);
  const loading = ref(true);
  let unsubscribe = null;

  onMounted(async () => {
    user.value = await accountHub.auth.getCurrentUser();
    loading.value = false;

    unsubscribe = accountHub.auth.onAuthStateChange((newUser) => {
      user.value = newUser;
    });
  });

  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });

  const signIn = async (email: string, password: string) => {
    await accountHub.auth.signIn({ email, password });
  };

  const signOut = async () => {
    await accountHub.auth.signOut();
  };

  return {
    user,
    loading,
    signIn,
    signOut,
  };
}
```

```vue
<template>
  <div v-if="loading">加载中...</div>
  <div v-else-if="!user">
    <button @click="signIn('user@example.com', 'password')">登录</button>
  </div>
  <div v-else>
    <h1>欢迎, {{ user.email }}</h1>
    <button @click="signOut">登出</button>
  </div>
</template>

<script setup>
import { useAuth } from "./composables/useAuth";

const { user, loading, signIn, signOut } = useAuth();
</script>
```

### React Native

```typescript
import { useState, useEffect } from "react";
import { initializeAccountHub, MemoryStorage } from "@accounthub/sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 创建 AsyncStorage 适配器
const asyncStorageAdapter = {
  getItem: async (key: string) => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};

// 初始化 SDK
const accountHub = initializeAccountHub({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  appId: process.env.APP_ID,
  appKey: process.env.APP_KEY,
  options: {
    storage: asyncStorageAdapter, // 使用 AsyncStorage
    defaultReturnUrl: "myapp://payment/callback",
  },
});

// 使用方式与 React 相同
function useAuth() {
  // ... 同 React 示例
}
```

### 完整的会员管理示例

```typescript
import { initializeAccountHub } from "@accounthub/sdk";

const accountHub = initializeAccountHub({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  appId: process.env.APP_ID,
  appKey: process.env.APP_KEY,
});

// 1. 用户注册并自动创建试用会员
async function registerWithTrial(
  email: string,
  password: string,
  fullName: string,
) {
  try {
    // 注册用户
    const { user, needsVerification } = await accountHub.auth.signUp({
      email,
      password,
      fullName,
    });

    if (needsVerification) {
      // 需要邮箱验证
      return { success: false, needsVerification: true };
    }

    // 创建试用会员
    const membership = await accountHub.membership.createMembership(user.id, {
      trialDays: 7,
      billingCycle: "monthly",
    });

    return { success: true, user, membership };
  } catch (error) {
    console.error("注册失败:", error);
    throw error;
  }
}

// 2. 购买会员套餐
async function purchaseMembership(userId: string, planId: string) {
  try {
    // 获取套餐信息
    const plan = await accountHub.payment.getMembershipPlan(planId);

    // 创建支付记录
    const payment = await accountHub.payment.createPayment(userId, {
      amount: plan.price,
      currency: plan.currency,
      paymentMethod: "alipay",
      metadata: { planId },
    });

    // 支付成功后，更新会员状态
    await accountHub.membership.updateMembershipStatus(userId, "active");

    return { success: true, payment };
  } catch (error) {
    console.error("购买失败:", error);
    throw error;
  }
}

// 3. 检查会员状态并提示续费
async function checkMembershipStatus(userId: string) {
  try {
    const membership = await accountHub.membership.getUserMembership(userId);

    if (!membership) {
      return { status: "no_membership", message: "您还不是会员" };
    }

    const isActive = await accountHub.membership.isMembershipActive(userId);
    const expiryDate =
      await accountHub.membership.getMembershipExpiryDate(userId);

    if (!isActive) {
      return { status: "expired", message: "您的会员已过期" };
    }

    // 检查是否即将过期（7天内）
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry <= 7) {
      return {
        status: "expiring_soon",
        message: `您的会员将在 ${daysUntilExpiry} 天后过期`,
        expiryDate,
      };
    }

    return { status: "active", message: "会员正常", expiryDate };
  } catch (error) {
    console.error("检查会员状态失败:", error);
    throw error;
  }
}

// 4. 使用兑换码激活会员
async function redeemMembershipCode(code: string) {
  try {
    // 先验证兑换码
    const codeInfo = await accountHub.redemption.validateCode(code);
    console.log("兑换码信息:", codeInfo);

    // 确认后兑换
    const result = await accountHub.redemption.redeemCode(code);

    if (result.success) {
      return {
        success: true,
        message: result.message,
        membershipId: result.data?.membershipId,
        expiresAt: result.data?.expiresAt,
      };
    }
  } catch (error) {
    console.error("兑换失败:", error);
    throw error;
  }
}
```

---

## 🔧 错误处理

SDK 提供了完整的错误类型和错误码，方便你进行精确的错误处理。

### 错误类型

```typescript
import {
  AuthError,
  AUTH_ERROR_CODES,
  MembershipError,
  MEMBERSHIP_ERROR_CODES,
  PaymentError,
  PAYMENT_ERROR_CODES,
  UpdateError,
  UPDATE_ERROR_CODES,
  RedemptionError,
  RedemptionErrorCode,
  ConfigError,
  CONFIG_ERROR_CODES,
} from "@accounthub/sdk";
```

### 统一错误处理

```typescript
try {
  await accountHub.auth.signIn({ email, password });
} catch (error) {
  if (error instanceof AuthError) {
    console.error("认证错误:", error.message, error.code);

    switch (error.code) {
      case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
        showError("邮箱或密码错误");
        break;
      case AUTH_ERROR_CODES.USER_NOT_FOUND:
        showError("用户不存在");
        break;
      case AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED:
        showError("请先验证邮箱");
        break;
      case AUTH_ERROR_CODES.USER_BANNED:
        showError("账户已被封禁");
        break;
      default:
        showError("登录失败，请稍后重试");
    }
  } else if (error instanceof MembershipError) {
    console.error("会员错误:", error.message, error.code);
  } else if (error instanceof PaymentError) {
    console.error("支付错误:", error.message, error.code);
  } else if (error instanceof UpdateError) {
    console.error("更新错误:", error.message, error.code);
  } else if (error instanceof RedemptionError) {
    console.error("兑换错误:", error.message, error.code);
  } else if (error instanceof ConfigError) {
    console.error("配置错误:", error.message, error.code);
  } else {
    console.error("未知错误:", error);
  }
}
```

### 认证错误码

```typescript
AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS", // 邮箱或密码错误
  USER_NOT_FOUND: "USER_NOT_FOUND", // 用户不存在
  EMAIL_NOT_CONFIRMED: "EMAIL_NOT_CONFIRMED", // 邮箱未验证
  USER_BANNED: "USER_BANNED", // 用户已被封禁
  WEAK_PASSWORD: "WEAK_PASSWORD", // 密码强度不足
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS", // 邮箱已存在
  INVALID_OTP: "INVALID_OTP", // OTP 验证码错误
  OTP_EXPIRED: "OTP_EXPIRED", // OTP 验证码已过期
  // ... 更多错误码
};
```

### 兑换码错误码

```typescript
RedemptionErrorCode = {
  CODE_NOT_FOUND: "CODE_NOT_FOUND", // 兑换码不存在
  CODE_EXPIRED: "CODE_EXPIRED", // 兑换码已过期
  CODE_EXHAUSTED: "CODE_EXHAUSTED", // 兑换码已用完
  CODE_DISABLED: "CODE_DISABLED", // 兑换码已禁用
  CODE_ALREADY_USED: "CODE_ALREADY_USED", // 已经使用过此兑换码
  USER_NOT_AUTHENTICATED: "USER_NOT_AUTHENTICATED", // 用户未登录
  REDEEM_FAILED: "REDEEM_FAILED", // 兑换失败
  NETWORK_ERROR: "NETWORK_ERROR", // 网络错误
};
```

---

## 🔒 安全最佳实践

### 1. 环境变量管理

```typescript
// ✅ 推荐：使用环境变量
const accountHub = initializeAccountHub({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  appId: import.meta.env.VITE_APP_ID,
  appKey: import.meta.env.VITE_APP_KEY,
});

// ❌ 不推荐：硬编码配置
const accountHub = initializeAccountHub({
  supabaseUrl: "https://xxx.supabase.co",
  // ...
});
```

### 2. 错误处理

```typescript
// ✅ 推荐：具体的错误处理
try {
  await accountHub.auth.signIn({ email, password });
} catch (error) {
  if (error instanceof AuthError) {
    if (error.code === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
      showError("邮箱或密码错误");
    }
  }
}

// ❌ 不推荐：忽略错误
await accountHub.auth.signIn({ email, password }).catch(() => {});
```

### 3. 事件监听清理

```typescript
// ✅ 推荐：记得取消订阅
useEffect(() => {
  const unsubscribe = accountHub.auth.onAuthStateChange((user) => {
    setUser(user);
  });
  return () => unsubscribe(); // 清理
}, []);

// ❌ 不推荐：不清理订阅
useEffect(() => {
  accountHub.auth.onAuthStateChange((user) => {
    setUser(user);
  });
}, []);
```

### 4. 用户输入验证

```typescript
// ✅ 推荐：验证用户输入
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}

// 使用前验证
if (!validateEmail(email)) {
  showError("请输入有效的邮箱地址");
  return;
}

if (!validatePassword(password)) {
  showError("密码长度至少为 8 位");
  return;
}

await accountHub.auth.signIn({ email, password });
```

### 5. 敏感信息保护

```typescript
// ✅ 推荐：不在日志中输出敏感信息
console.log("用户登录:", { userId: user.id });

// ❌ 不推荐：输出完整用户信息
console.log("用户登录:", user);
```

---

## 📚 类型定义

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

### 存储适配器

```typescript
interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

// 内置适配器
class WebStorage implements StorageAdapter {
  /* ... */
}
class MemoryStorage implements StorageAdapter {
  /* ... */
}
```

### 用户类型

```typescript
interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_banned?: boolean;
  registered_from_app_id?: string;
  created_at?: string;
  updated_at?: string;
}
```

### 会员类型

```typescript
interface UserMembership {
  id: string;
  user_id: string;
  application_id: string;
  membership_plan_id?: string;
  status: MembershipStatus;
  billing_cycle?: BillingCycle;
  trial_ends_at?: string;
  expires_at?: string;
  auto_renew?: boolean;
  created_at: string;
  updated_at: string;
}

type MembershipStatus =
  | "active"
  | "inactive"
  | "cancelled"
  | "expired"
  | "trial";
type BillingCycle = "monthly" | "yearly";
```

### 支付类型

```typescript
interface PaymentRecord {
  id: string;
  user_id: string;
  membership_id?: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  session_id?: string; // 新增：支付会话 ID
  invoice_url?: string;
  paid_at?: string;
  created_at: string;
}

interface CheckoutSession {
  sessionId: string;
  paymentId: string; // 新增：支付记录 ID
  paymentUrl: string;
  expiresAt: string;
}

interface PaymentChannelConfig {
  id: string;
  application_id: string | null;
  payment_method: string;
  config: any;
  is_active: boolean | null;
  is_sandbox: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

type PaymentMethod = "stripe" | "alipay" | "wechat" | "epay" | "manual";
type PaymentStatus = "success" | "failed" | "pending" | "refunded";
```

### 版本类型

```typescript
interface VersionInfo {
  id: string;
  application_id: string;
  version_number: string;
  version_code: number;
  release_notes?: string;
  download_url?: string;
  file_size?: number;
  file_hash?: string;
  min_supported_version?: string;
  is_force_update: boolean;
  is_published: boolean;
  platform: Platform;
  created_at: string;
  published_at?: string;
}

type Platform =
  | "android"
  | "ios"
  | "windows"
  | "macos"
  | "linux"
  | "web"
  | "all";
```

---

## 🏗️ 项目结构

```
accounthubsdk/
├── src/
│   ├── core/              # 核心模块
│   │   ├── client.ts      # Supabase 客户端
│   │   ├── config.ts      # 配置管理
│   │   ├── events.ts      # 事件系统
│   │   ├── storage.ts     # 存储适配器
│   │   └── types.ts       # 核心类型
│   ├── auth/              # 认证模块
│   │   ├── auth.ts
│   │   ├── types.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   ├── membership/        # 会员模块
│   │   ├── membership.ts
│   │   ├── types.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   ├── payment/           # 支付模块
│   │   ├── payment.ts
│   │   ├── types.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   ├── update/            # 更新模块
│   │   ├── update.ts
│   │   ├── types.ts
│   │   ├── errors.ts
│   │   ├── version-compare.ts
│   │   ├── platform.ts
│   │   └── index.ts
│   ├── redemption/        # 兑换码模块
│   │   ├── redemption.ts
│   │   ├── types.ts
│   │   └── errors.ts
│   ├── config/            # 配置模块
│   │   ├── config.ts
│   │   ├── types.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   ├── accounthub.ts      # 主类
│   └── index.ts           # 主导出
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📝 更新日志

### v1.0.1 (2026-02-07)

**支付模块增强**

- ✨ 新增 `createMembershipCheckoutSession` 便捷方法，简化会员购买流程
- ✨ 新增 `getPaymentBySessionId` 方法，支持通过会话 ID 查询支付记录
- ✨ 新增 `verifyPaymentBySessionId` 方法，快速验证支付状态
- ✨ `CheckoutSession` 接口新增 `paymentId` 字段，方便直接获取支付记录 ID
- ✨ 导出 `PaymentChannelConfig` 类型，提供完整的类型支持

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

- [Supabase 文档](https://supabase.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [AccountHub 管理后台](https://github.com/qgming/accounthub)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 💬 支持

如有问题，请通过以下方式联系：

- 提交 Issue

---

## 🙏 致谢

感谢以下开源项目：

- [Supabase](https://supabase.com/) - 开源的 Firebase 替代方案
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集
