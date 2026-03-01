# Update 模块 API

`accountHub.update` — 检查应用版本更新，自动检测当前平台，内置缓存（上限 50 条）。

---

## 方法列表

### `checkUpdate(options)`

检查是否有可用更新。

```typescript
const result = await accountHub.update.checkUpdate({
  currentVersion: "1.0.0",
  cacheDuration: 5 * 60 * 1000,  // 缓存时长（ms），默认 5 分钟
});

if (result.hasUpdate) {
  console.log("最新版本:", result.latestVersion?.version_number);
  console.log("是否强制更新:", result.isForceUpdate);
  console.log("下载地址:", result.latestVersion?.download_url);
  console.log("更新说明:", result.latestVersion?.release_notes);
}
```

**返回**：`UpdateResult`

```typescript
interface UpdateResult {
  hasUpdate: boolean;
  isForceUpdate: boolean;
  latestVersion: AppVersion | null;
  currentVersion: string;
}

interface AppVersion {
  id: string;
  application_id: string;
  version_number: string;
  release_notes: string | null;
  download_url: string | null;
  is_force_update: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}
```

---

### `clearCache()`

清除所有更新缓存。

```typescript
accountHub.update.clearCache();
```

---

## 工具函数（顶层导出）

```typescript
import { compareVersions, isVersionGreater, detectPlatform } from "@accounthub/sdk";
```

### `compareVersions(v1, v2)`

比较两个语义版本号。

```typescript
compareVersions("1.2.0", "1.1.0")  // 1  (v1 > v2)
compareVersions("1.0.0", "1.0.0")  // 0  (相等)
compareVersions("1.0.0", "2.0.0")  // -1 (v1 < v2)
```

### `isVersionGreater(v1, v2)`

判断 v1 是否比 v2 新。

```typescript
isVersionGreater("2.0.0", "1.9.9")  // true
```

### `detectPlatform()`

自动检测当前运行平台。

```typescript
type Platform = "windows" | "macos" | "linux" | "ios" | "android" | "unknown";

const platform = detectPlatform();
```

---

## 错误码

```typescript
import { UpdateError, UPDATE_ERROR_CODES } from "@accounthub/sdk";

UPDATE_ERROR_CODES.NETWORK_ERROR  // 网络请求失败
UPDATE_ERROR_CODES.UNKNOWN        // 未知错误
```

---

## 相关事件

```typescript
accountHub.events.on("update:available", ({ version }) => {
  // version: string
  console.log("发现新版本:", version);
});
```

---

## 缓存行为

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `cacheDuration` | `300000`（5 分钟） | 缓存有效期（ms） |
| `MAX_CACHE_SIZE` | `50` | 最大缓存条目数，超出时淘汰最旧条目 |
