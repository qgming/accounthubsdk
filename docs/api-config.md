# Config 模块 API

`accountHub.config` — 应用配置读取，支持端到端 AES-256-GCM 自动解密，**离线优先**架构，智能后台更新。

---

## v1.0.4 新特性

### 🚀 离线优先架构

- **持久化缓存**：配置永久缓存到本地存储，离线可用
- **智能更新**：优先返回缓存，后台静默更新（24h 节流，1.2s 超时）
- **指数退避**：网络失败时自动重试，最多 5 次
- **零阻塞**：异步解密（Web Worker / setTimeout 分片）

### ⚡ 新增 API

- `getConfigAsync()` — 完全异步的配置获取
- `batchGetConfigsAsync()` — 批量异步获取
- `getCacheInfo()` — 查询缓存状态
- `forceRefresh` 选项 — 强制刷新配置
- `fallbackValue` 选项 — 降级默认值

---

## 加密说明

管理后台写入加密配置时格式为 `{ _enc: "enc:v1:<hex(nonce)>.<hex(ciphertext+authTag)>" }`。

SDK 使用 `appKey + appId` 经 PBKDF2-SHA256（10 万次迭代）派生 AES-256-GCM 密钥，**自动解密**——应用代码读取到的 `config_data` 永远是明文对象，无需额外处理。

v1.0.4 支持 **Web Worker 异步解密**（浏览器）和 **setTimeout 分片**（React Native），不再阻塞主线程。

---

## 方法列表

### `getConfig(configKey, options?)`

根据 `config_key` 获取单条配置（自动解密）。

**v1.0.4 默认行为**：优先返回持久化缓存，后台静默更新。

```typescript
const config = await accountHub.config.getConfig("announcement", {
  useCache: true,                   // 是否使用缓存，默认 true
  cacheDuration: 5 * 60 * 1000,    // 内存缓存时长（ms），默认 5 分钟
  forceRefresh: false,              // 强制刷新，忽略节流，默认 false
  fallbackValue: null,              // 降级默认值，默认 null
  timeout: 10000,                   // 自定义超时（ms），默认 10000
});

console.log(config.config_data);   // 已自动解密的明文对象
```

**返回**：`AppConfig | null`

---

### `getConfigAsync(configKey, options?)` ✨ v1.0.4 新增

完全异步的配置获取方法，使用 Web Worker 解密（浏览器）或 setTimeout 分片（React Native）。

```typescript
const config = await accountHub.config.getConfigAsync("announcement", {
  useCache: true,
  forceRefresh: false,
  fallbackValue: null,
  timeout: 10000,
});
```

**返回**：`Promise<AppConfig | null>`

---

### `batchGetConfigsAsync(configKeys, options?)` ✨ v1.0.4 新增

批量异步获取多条配置，使用异步解密。

```typescript
const configs = await accountHub.config.batchGetConfigsAsync(
  ["announcement", "llm_config", "api_config"],
  {
    useCache: true,
    timeout: 10000,
  }
);
```

**返回**：`Promise<AppConfig[]>`

---

### `getCacheInfo(configKey)` ✨ v1.0.4 新增

查询配置的缓存状态。

```typescript
const info = await accountHub.config.getCacheInfo("announcement");

console.log(info);
// {
//   hasCache: true,
//   metadata: {
//     configKey: "announcement",
//     timestamp: 1710345600000,
//     lastUpdateAttempt: 1710345600000,
//     updateAttempts: 0,
//     lastSuccessfulUpdate: 1710345600000,
//     version: "1.0"
//   },
//   dataSize: 1234
// }
```

**返回**：`Promise<{ hasCache: boolean; metadata: CacheMetadata | null; dataSize: number }>`

---

### `getConfigValue(configKey, field, defaultValue?)`

读取配置中某个字段的值。

```typescript
const title = await accountHub.config.getConfigValue(
  "announcement",
  "title",
  "默认标题",    // 字段不存在时的默认值（可选）
);
```

**返回**：`unknown`（需自行断言类型）

---

### `getConfigData(configKey)`

直接返回 `config_data` 对象。

```typescript
const data = await accountHub.config.getConfigData("announcement");
// 返回: Record<string, unknown> | null
```

---

### `getConfigs(configKeys)`

批量获取多条配置。

```typescript
const configs = await accountHub.config.getConfigs([
  "announcement",
  "llm_config",
  "api_config",
]);
// 返回: AppConfig[]（不存在的 key 不会出现在结果中）
```

---

### `getConfigsByType(configType)`

按类型获取配置列表。

```typescript
const announcements = await accountHub.config.getConfigsByType("announcement");
// 返回: AppConfig[]
```

**可用类型**：

```typescript
type ConfigType = "announcement" | "llm_config" | "api_config" | "feature_flag" | "custom";
```

---

### `clearCache(configKey?)`

清除配置缓存。

```typescript
accountHub.config.clearCache("announcement");  // 清除指定 key 的缓存
accountHub.config.clearCache();                // 清除所有配置缓存
```

---

## 类型定义

```typescript
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
```

---

## 错误码

```typescript
import { ConfigError, CONFIG_ERROR_CODES, TimeoutError, isTimeoutError } from "@accounthub/sdk";

CONFIG_ERROR_CODES.NOT_FOUND        // 配置不存在
CONFIG_ERROR_CODES.DECRYPT_FAILED   // 解密失败（appKey 不匹配）
CONFIG_ERROR_CODES.UNKNOWN          // 未知错误

// v1.0.4 新增：超时错误
try {
  const config = await accountHub.config.getConfig("announcement");
} catch (error) {
  if (isTimeoutError(error)) {
    console.error("配置获取超时", error.timeoutMs);
  }
}
```

---

## 类型定义

```typescript
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

// v1.0.4 新增
interface GetConfigOptions {
  useCache?: boolean;          // 是否使用缓存，默认 true
  cacheDuration?: number;      // 内存缓存时长（毫秒），默认 5 分钟
  forceRefresh?: boolean;      // 强制刷新，忽略节流，默认 false
  fallbackValue?: AppConfig;   // 降级默认值
  timeout?: number;            // 自定义超时（覆盖默认值）
}

interface CacheMetadata {
  configKey: string;
  timestamp: number;              // 缓存时间戳
  lastUpdateAttempt: number;      // 最后更新尝试时间
  updateAttempts: number;         // 更新尝试次数
  lastSuccessfulUpdate: number;   // 最后成功更新时间
  version: string;                // 缓存版本
}

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
```

---

## 最佳实践

### 离线优先场景

```typescript
// 优先使用缓存，后台更新（默认行为）
const config = await accountHub.config.getConfig("announcement");
```

### 强制刷新场景

```typescript
// 用户手动刷新，忽略节流
const config = await accountHub.config.getConfig("announcement", {
  forceRefresh: true,
});
```

### 降级默认值

```typescript
// 网络失败时使用默认值
const config = await accountHub.config.getConfig("announcement", {
  fallbackValue: {
    id: "default",
    config_key: "announcement",
    config_data: { title: "默认公告", content: "暂无公告" },
    // ... 其他字段
  },
});
```

### 异步解密（不阻塞 UI）

```typescript
// 使用 Web Worker 解密，适合大型配置
const config = await accountHub.config.getConfigAsync("llm_config");
```

### 批量获取

```typescript
// 批量异步获取，并行解密
const configs = await accountHub.config.batchGetConfigsAsync([
  "announcement",
  "llm_config",
  "api_config",
]);
```

### 查询缓存状态

```typescript
// 检查配置是否已缓存
const info = await accountHub.config.getCacheInfo("announcement");
if (info.hasCache) {
  console.log("缓存命中，最后更新:", new Date(info.metadata.lastSuccessfulUpdate));
}
```

---

## 配置更新策略 ✨ v1.0.4 新增

初始化时可配置更新策略：

```typescript
import { initializeAccountHub } from "@accounthub/sdk";

const accountHub = initializeAccountHub({
  supabaseUrl: "...",
  supabaseAnonKey: "...",
  appId: "...",
  appKey: "...",
  options: {
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
  }
});
```

---

## 缓存行为

### v1.0.4 离线优先架构

| 层级 | 说明 |
|------|------|
| **内存缓存** | 最多 100 条，LRU 淘汰，进程重启清空 |
| **持久化缓存** | 无限制，永不过期，存储到 localStorage / AsyncStorage |
| **后台更新** | 24h 节流，1.2s 超时，指数退避重试（最多 5 次） |

### 获取配置流程

1. 检查内存缓存（5 分钟有效期）
2. 检查持久化缓存（永不过期）
3. 如果有缓存，立即返回
4. 后台静默更新（非阻塞）
5. 如果无缓存，同步查询数据库（10s 超时）

### v1.0.3 及之前版本

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `useCache` | `true` | 是否读取/写入缓存 |
| `cacheDuration` | `300000`（5 分钟） | 缓存有效期（ms） |
| `MAX_CACHE_SIZE` | `100` | 最大缓存条目数，超出时淘汰最旧条目 |
