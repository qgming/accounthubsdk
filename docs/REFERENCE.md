# AccountHub SDK — 快速参考（AI 编码辅助）

> 本文档为 AI 代码辅助提供精确的类型定义和 API 速查。完整说明见各模块文档。

---

## 初始化

```typescript
import { initializeAccountHub } from "@accounthub/sdk";

const accountHub = initializeAccountHub({
  supabaseUrl: string,       // 必填：Supabase 项目 URL
  supabaseAnonKey: string,   // 必填：Supabase 匿名密钥
  appId: string,             // 必填：AccountHub 应用 UUID
  appKey: string,            // 必填：应用密钥（同时用于配置解密）
  options?: {
    trialDays?: number,               // 默认 7
    autoCreateMembership?: boolean,   // 默认 false
    enablePasswordReset?: boolean,    // 默认 true
    defaultReturnUrl?: string,        // 移动端支付回调必填
    storage?: StorageAdapter,         // React Native 自定义存储
  }
});
```

`initializeAccountHub` 返回单例，重复调用返回同一实例。

---

## 核心类型

```typescript
// 会员状态（v1.0.2 对齐数据库约束）
type MembershipStatus = "active" | "inactive" | "expired";

// 计费周期
type BillingCycle = "monthly" | "yearly";

// 平台
type Platform = "windows" | "macos" | "linux" | "ios" | "android" | "unknown";

// 配置类型
type ConfigType = "announcement" | "llm_config" | "api_config" | "feature_flag" | "custom";

// 用户
interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  app_id: string;
  is_banned: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// 会员
interface UserMembership {
  id: string;
  user_id: string;
  application_id: string;
  status: MembershipStatus;
  billing_cycle: string | null;
  membership_plan_id: string | null;
  expires_at: string | null;
  auto_renew: boolean | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

// 应用配置
interface AppConfig {
  id: string;
  application_id: string | null;
  config_key: string;
  config_type: string;
  config_data: Record<string, unknown>;  // 已自动解密
  description: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// 支付渠道
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

// 支付会话
interface CheckoutSession {
  sessionId: string;
  paymentId: string;
  paymentUrl: string;
}

// 更新结果
interface UpdateResult {
  hasUpdate: boolean;
  isForceUpdate: boolean;
  latestVersion: AppVersion | null;
  currentVersion: string;
}

// 存储适配器（React Native）
interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}
```

---

## API 速查表

### Auth

| 方法 | 签名 | 返回 |
|------|------|------|
| `signUp` | `({ email, password, fullName? })` | `Promise<{ user: User, needsVerification: boolean }>` |
| `verifyOtp` | `(email, token, fullName?)` | `Promise<void>` |
| `signIn` | `({ email, password })` | `Promise<{ user: User, session: Session }>` |
| `signOut` | `()` | `Promise<void>` |
| `getCurrentUser` | `()` | `Promise<User \| null>` |
| `updatePassword` | `(newPassword)` | `Promise<void>` |
| `updateProfile` | `({ fullName?, avatarUrl? })` | `Promise<void>` |
| `onAuthStateChange` | `(callback: (user: User \| null) => void)` | `() => void`（取消订阅函数） |

### Membership

| 方法 | 签名 | 返回 |
|------|------|------|
| `getUserMembership` | `(userId)` | `Promise<UserMembership \| null>` |
| `createMembership` | `(userId, options?)` | `Promise<UserMembership>` |
| `updateMembership` | `(userId, updates)` | `Promise<UserMembership>` |
| `updateMembershipStatus` | `(userId, status: MembershipStatus)` | `Promise<UserMembership>` |
| `cancelMembership` | `(userId)` | `Promise<void>` |
| `isMembershipActive` | `(userId)` | `Promise<boolean>` |
| `getMembershipExpiryDate` | `(userId)` | `Promise<Date \| null>` |

### Payment

| 方法 | 签名 | 返回 |
|------|------|------|
| `getMembershipPlans` | `()` | `Promise<MembershipPlan[]>` |
| `getMembershipPlan` | `(planId)` | `Promise<MembershipPlan \| null>` |
| `createMembershipCheckoutSession` | `(userId, planId, channelId, options?)` | `Promise<CheckoutSession>` |
| `verifyPaymentBySessionId` | `(sessionId)` | `Promise<boolean>` |
| `getPaymentBySessionId` | `(sessionId)` | `Promise<PaymentRecord \| null>` |
| `getPaymentChannels` | `()` | `Promise<PaymentChannelConfig[]>` |
| `getPaymentChannel` | `(channelId)` | `Promise<PaymentChannelConfig \| null>` |

### Config

| 方法 | 签名 | 返回 |
|------|------|------|
| `getConfig` | `(key, options?)` | `Promise<AppConfig \| null>` |
| `getConfigValue` | `(key, field, defaultValue?)` | `Promise<unknown>` |
| `getConfigData` | `(key)` | `Promise<Record<string, unknown> \| null>` |
| `getConfigs` | `(keys: string[])` | `Promise<AppConfig[]>` |
| `getConfigsByType` | `(type: ConfigType)` | `Promise<AppConfig[]>` |
| `clearCache` | `(key?)` | `void` |

### Update

| 方法 | 签名 | 返回 |
|------|------|------|
| `checkUpdate` | `({ currentVersion, cacheDuration? })` | `Promise<UpdateResult>` |
| `clearCache` | `()` | `void` |

### Redemption

| 方法 | 签名 | 返回 |
|------|------|------|
| `redeemCode` | `(code)` | `Promise<RedemptionResult>` |
| `validateCode` | `(code)` | `Promise<RedemptionCodeInfo>` |
| `getUserRedemptions` | `()` | `Promise<RedemptionCodeUse[]>` |

---

## 错误类型汇总

```typescript
import {
  AuthError,       AUTH_ERROR_CODES,
  MembershipError, MEMBERSHIP_ERROR_CODES,
  PaymentError,    PAYMENT_ERROR_CODES,
  UpdateError,     UPDATE_ERROR_CODES,
  RedemptionError, RedemptionErrorCode,
  ConfigError,     CONFIG_ERROR_CODES,
} from "@accounthub/sdk";

// 通用错误捕获模式
try {
  await accountHub.auth.signIn({ email, password });
} catch (error) {
  if (error instanceof AuthError) {
    console.error(error.code, error.message);
  }
}
```

| 模块 | 错误类 | 错误码对象 |
|------|--------|-----------|
| Auth | `AuthError` | `AUTH_ERROR_CODES` |
| Membership | `MembershipError` | `MEMBERSHIP_ERROR_CODES` |
| Payment | `PaymentError` | `PAYMENT_ERROR_CODES` |
| Update | `UpdateError` | `UPDATE_ERROR_CODES` |
| Redemption | `RedemptionError` | `RedemptionErrorCode`（enum） |
| Config | `ConfigError` | `CONFIG_ERROR_CODES` |

---

## 事件系统

```typescript
// 订阅事件
const off = accountHub.events.on("event:name", (payload) => {});
// 取消订阅
off();

// 全部事件签名
"auth:signin"          → { userId: string }
"auth:signout"         → {}
"auth:statechange"     → { user: User | null }
"membership:created"   → { membership: UserMembership }
"membership:updated"   → { membership: UserMembership }
"membership:cancelled" → { membership: UserMembership }
"payment:created"      → { paymentId: string }
"payment:completed"    → { paymentId: string }
"payment:failed"       → { paymentId: string, error: string }
"update:available"     → { version: string }
```

---

## 顶层工具导出

```typescript
import {
  initializeAccountHub,
  compareVersions,     // (v1: string, v2: string) => -1 | 0 | 1
  isVersionGreater,    // (v1: string, v2: string) => boolean
  detectPlatform,      // () => Platform
} from "@accounthub/sdk";
```

---

## 框架集成模板

### React

```typescript
// sdk.ts — 单例初始化
import { initializeAccountHub } from "@accounthub/sdk";
export const sdk = initializeAccountHub({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  appId: import.meta.env.VITE_APP_ID,
  appKey: import.meta.env.VITE_APP_KEY,
});

// useAuth.ts
import { useState, useEffect } from "react";
import { sdk } from "./sdk";

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    sdk.auth.getCurrentUser().then(setUser);
    return sdk.auth.onAuthStateChange(setUser);
  }, []);

  return { user, signIn: sdk.auth.signIn.bind(sdk.auth), signOut: sdk.auth.signOut.bind(sdk.auth) };
}
```

### Vue 3

```typescript
// composables/useAuth.ts
import { ref, onMounted, onUnmounted } from "vue";
import { sdk } from "./sdk";

export function useAuth() {
  const user = ref(null);
  let unsubscribe: (() => void) | null = null;

  onMounted(async () => {
    user.value = await sdk.auth.getCurrentUser();
    unsubscribe = sdk.auth.onAuthStateChange((u) => { user.value = u; });
  });

  onUnmounted(() => unsubscribe?.());
  return { user };
}
```

### React Native

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAccountHub } from "@accounthub/sdk";

export const sdk = initializeAccountHub({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  appId: process.env.APP_ID!,
  appKey: process.env.APP_KEY!,
  options: {
    storage: AsyncStorage,
    defaultReturnUrl: "myapp://payment/callback",
  },
});
```
