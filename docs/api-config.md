# Config 模块 API

`accountHub.config` — 应用配置读取，支持端到端 AES-256-GCM 自动解密，内置缓存（上限 100 条）。

---

## 加密说明

管理后台写入加密配置时格式为 `{ _enc: "enc:v1:<hex(nonce)>.<hex(ciphertext+authTag)>" }`。

SDK 使用 `appKey + appId` 经 PBKDF2-SHA256（10 万次迭代）派生 AES-256-GCM 密钥，**自动解密**——应用代码读取到的 `config_data` 永远是明文对象，无需额外处理。

---

## 方法列表

### `getConfig(configKey, options?)`

根据 `config_key` 获取单条配置（自动解密）。

```typescript
const config = await accountHub.config.getConfig("announcement", {
  useCache: true,                   // 是否使用缓存，默认 true
  cacheDuration: 5 * 60 * 1000,    // 缓存时长（ms），默认 5 分钟
});

console.log(config.config_data);   // 已自动解密的明文对象
```

**返回**：`AppConfig | null`

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
import { ConfigError, CONFIG_ERROR_CODES } from "@accounthub/sdk";

CONFIG_ERROR_CODES.NOT_FOUND        // 配置不存在
CONFIG_ERROR_CODES.DECRYPT_FAILED   // 解密失败（appKey 不匹配）
CONFIG_ERROR_CODES.UNKNOWN          // 未知错误
```

---

## 缓存行为

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `useCache` | `true` | 是否读取/写入缓存 |
| `cacheDuration` | `300000`（5 分钟） | 缓存有效期（ms） |
| `MAX_CACHE_SIZE` | `100` | 最大缓存条目数，超出时淘汰最旧条目 |
