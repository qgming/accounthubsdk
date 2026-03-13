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
    configUpdateOptions?: ConfigUpdateOptions,  // ✨ v1.0.4 新增：配置更新策略
  }
});
```

`initializeAccountHub` 返回单例，重复调用返回同一实例。

**v1.0.4 配置更新策略**：

```typescript
configUpdateOptions: {
  offlineFirst: true,                      // 离线优先，默认 true
  updateThrottleMs: 24 * 60 * 60 * 1000,  // 更新节流时间，默认 24h
  backgroundUpdateTimeoutMs: 1200,         // 后台更新超时，默认 1.2s
  manualUpdateTimeoutMs: 10000,            // 手动更新超时，默认 10s
  retryBackoff: {
    initialDelayMs: 1000,                  // 初始延迟，默认 1s
    maxDelayMs: 60000,                     // 最大延迟，默认 60s
    multiplier: 2,                         // 倍数，默认 2
    maxRetries: 5,                         // 最大重试次数，默认 5
  },
  useWorkerForDecryption: true,            // 使用 Worker 解密，默认 true
  persistentCachePrefix: 'accounthub_config_',  // 缓存前缀
  storeDecryptedData: true,                // 存储解密后的数据，默认 true
}
```

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

// ✨ v1.0.4 新增：配置获取选项
interface GetConfigOptions {
  useCache?: boolean;          // 是否使用缓存，默认 true
  cacheDuration?: number;      // 内存缓存时长（毫秒），默认 5 分钟
  forceRefresh?: boolean;      // 强制刷新，忽略节流，默认 false
  fallbackValue?: AppConfig;   // 降级默认值
  timeout?: number;            // 自定义超时（覆盖默认值）
}

// ✨ v1.0.4 新增：缓存元数据
interface CacheMetadata {
  configKey: string;
  timestamp: number;              // 缓存时间戳
  lastUpdateAttempt: number;      // 最后更新尝试时间
  updateAttempts: number;         // 更新尝试次数
  lastSuccessfulUpdate: number;   // 最后成功更新时间
  version: string;                // 缓存版本
}

// ✨ v1.0.4 新增：配置更新策略
interface ConfigUpdateOptions {
  offlineFirst?: boolean;              // 离线优先，默认 true
  updateThrottleMs?: number;           // 更新节流时间，默认 24h
  backgroundUpdateTimeoutMs?: number;  // 后台更新超时，默认 1200ms
  manualUpdateTimeoutMs?: number;      // 手动更新超时，默认 10000ms
  retryBackoff?: {
    initialDelayMs?: number;           // 初始延迟，默认 1000ms
    maxDelayMs?: number;               // 最大延迟，默认 60000ms
    multiplier?: number;               // 倍数，默认 2
    maxRetries?: number;               // 最大重试次数，默认 5
  };
  useWorkerForDecryption?: boolean;    // 使用 Worker 解密，默认 true
  persistentCachePrefix?: string;      // 持久化缓存前缀
  storeDecryptedData?: boolean;        // 存储解密后的数据，默认 true
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
| `trackActive` | `()` | `Promise<void>` |
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
| `getConfigAsync` ✨ v1.0.4 | `(key, options?)` | `Promise<AppConfig \| null>` |
| `batchGetConfigsAsync` ✨ v1.0.4 | `(keys: string[], options?)` | `Promise<AppConfig[]>` |
| `getCacheInfo` ✨ v1.0.4 | `(key)` | `Promise<{ hasCache: boolean; metadata: CacheMetadata \| null; dataSize: number }>` |
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

### AI

| 方法 | 签名 | 返回 |
|------|------|------|
| `chat` | `(modelKey, options: ChatOptions)` | `Promise<ChatCompletion>` |
| `chatStream` | `(modelKey, options: ChatOptions)` | `AsyncGenerator<ChatStreamChunk>` |
| `speechToText` | `(modelKey, audio: Blob, options?: STTOptions)` | `Promise<STTResult>` |
| `generateImage` | `(modelKey, prompt: string, options?: ImageGenOptions)` | `Promise<ImageGenResult>` |

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
  AIError,         AI_ERROR_CODES,
  RedemptionError, RedemptionErrorCode,
  ConfigError,     CONFIG_ERROR_CODES,
  TimeoutError,    isTimeoutError,  // ✨ v1.0.4 新增
} from "@accounthub/sdk";

// 通用错误捕获模式
try {
  await accountHub.auth.signIn({ email, password });
} catch (error) {
  if (error instanceof AuthError) {
    console.error(error.code, error.message);
  }
}

// v1.0.4 超时错误处理
try {
  const config = await accountHub.config.getConfig("announcement");
} catch (error) {
  if (isTimeoutError(error)) {
    console.error("配置获取超时", error.timeoutMs);
  }
}
```

| 模块 | 错误类 | 错误码对象 |
|------|--------|-----------|
| Auth | `AuthError` | `AUTH_ERROR_CODES` |
| Membership | `MembershipError` | `MEMBERSHIP_ERROR_CODES` |
| Payment | `PaymentError` | `PAYMENT_ERROR_CODES` |
| Update | `UpdateError` | `UPDATE_ERROR_CODES` |
| AI | `AIError` | `AI_ERROR_CODES` |
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

## AI 模块导出

```typescript
import {
  AI,
  AIError,
  AI_ERROR_CODES,
  type ChatMessage,
  type ChatOptions,
  type ChatCompletion,
  type ChatStreamChunk,
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
