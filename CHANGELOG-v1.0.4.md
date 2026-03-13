# AccountHub SDK v1.0.4 更新日志

**发布日期**: 2026-03-13

---

## 概述

v1.0.4 是配置模块的重大升级版本，引入了**离线优先架构**、**异步解密优化**和**智能后台更新**，大幅提升了配置获取的性能和离线体验。

---

## 核心变更

### 🚀 离线优先架构

#### 持久化缓存管理器 (`PersistentCacheManager`)
- **永久缓存**：配置缓存到 localStorage/AsyncStorage，永不过期
- **双层缓存**：内存缓存（100 条 LRU）+ 持久化缓存（无限制）
- **元数据追踪**：记录缓存时间、更新尝试次数、最后成功更新时间、版本号
- **离线可用**：无网络时直接返回缓存数据

#### 更新调度器 (`UpdateScheduler`)
- **智能节流**：24 小时内不重复更新同一配置
- **指数退避**：网络失败时自动重试，延迟从 1s 到 60s，最多 5 次
- **后台更新**：非阻塞式后台更新，1.2s 超时，静默失败
- **并发控制**：防止重复更新任务

#### 配置更新策略 (`ConfigUpdateOptions`)
```typescript
{
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
  persistentCachePrefix: 'accounthub_config_',
  storeDecryptedData: true,                // 存储解密后的数据，默认 true
}
```

---

### ⚡ 异步解密优化

#### 异步加密工具 (`AsyncCrypto`)
- **Web Worker 解密**：浏览器环境使用 Worker 异步解密，不阻塞主线程
- **setTimeout 分片**：React Native 使用 setTimeout 分片执行，避免卡顿
- **密钥缓存**：派生密钥在实例生命周期内缓存，避免重复 PBKDF2 计算
- **自动降级**：Worker 不可用时降级到同步解密

#### 新增异步 API
- `getConfigAsync(configKey, options?)` - 完全异步的配置获取
- `batchGetConfigsAsync(configKeys, options?)` - 批量异步获取配置

---

### ⏱️ 超时控制

#### 超时控制器 (`TimeoutController`)
- **统一管理**：`withTimeout()` 和 `queryWithTimeout()` 工具函数
- **独立配置**：手动更新（10s）和后台更新（1.2s）独立超时
- **错误类型**：新增 `TimeoutError` 类和 `isTimeoutError()` 判断函数

```typescript
import { isTimeoutError } from "@accounthub/sdk";

try {
  const config = await sdk.config.getConfig("announcement");
} catch (error) {
  if (isTimeoutError(error)) {
    console.error("配置获取超时", error.timeoutMs);
  }
}
```

---

### 📊 缓存元数据

#### 缓存信息查询
- `getCacheInfo(configKey)` - 查询配置的缓存状态

```typescript
const info = await sdk.config.getCacheInfo("announcement");
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

---

### 🔧 API 增强

#### `getConfig()` 新增选项
```typescript
interface GetConfigOptions {
  useCache?: boolean;          // 是否使用缓存，默认 true
  cacheDuration?: number;      // 内存缓存时长（毫秒），默认 5 分钟
  forceRefresh?: boolean;      // 强制刷新，忽略节流，默认 false ✨ 新增
  fallbackValue?: AppConfig;   // 降级默认值 ✨ 新增
  timeout?: number;            // 自定义超时（覆盖默认值）✨ 新增
}
```

#### 使用示例
```typescript
// 强制刷新
const config = await sdk.config.getConfig("announcement", {
  forceRefresh: true,
});

// 降级默认值
const config = await sdk.config.getConfig("announcement", {
  fallbackValue: { /* 默认配置 */ },
});

// 自定义超时
const config = await sdk.config.getConfig("announcement", {
  timeout: 5000,  // 5s 超时
});
```

---

## 破坏性变更

### Config 构造函数签名变更

**v1.0.3 及之前**:
```typescript
new Config(storage: StorageAdapter)
```

**v1.0.4**:
```typescript
new Config(storage: StorageAdapter, updateOptions?: ConfigUpdateOptions)
```

### 默认行为变更

| 行为 | v1.0.3 | v1.0.4 |
|------|--------|--------|
| 配置获取 | 每次查询数据库 | 优先返回缓存，后台更新 |
| 缓存策略 | 仅内存缓存（5 分钟） | 内存 + 持久化缓存（永不过期） |
| 网络失败 | 抛出错误 | 返回缓存或降级默认值 |

### 迁移指南

**保持旧版本行为**:
```typescript
const sdk = initializeAccountHub({
  // ...
  options: {
    configUpdateOptions: {
      offlineFirst: false,  // 禁用离线优先
    }
  }
});
```

**推荐新行为**（默认）:
```typescript
// 无需配置，默认启用离线优先
const sdk = initializeAccountHub({
  // ...
});
```

---

## 新增导出

### 类型
- `GetConfigOptions` - 配置获取选项
- `ConfigUpdateOptions` - 配置更新策略
- `CacheMetadata` - 缓存元数据
- `TimeoutError` - 超时错误类

### 函数
- `isTimeoutError(error)` - 判断是否为超时错误

---

## 性能提升

| 场景 | v1.0.3 | v1.0.4 | 提升 |
|------|--------|--------|------|
| 首次获取配置 | ~200ms（网络 + 解密） | ~200ms（网络 + 异步解密） | 主线程不阻塞 |
| 缓存命中 | ~100ms（解密） | ~1ms（内存缓存） | **100x** |
| 离线获取 | 失败 | ~1ms（持久化缓存） | **∞** |
| 大型配置解密 | 阻塞主线程 ~500ms | Worker 异步 ~500ms | 主线程不阻塞 |

---

## 文件变更

### 新增文件
- `src/core/crypto-async.ts` - 异步加密工具
- `src/config/cache-manager.ts` - 持久化缓存管理器
- `src/config/update-scheduler.ts` - 更新调度器
- `src/config/timeout-controller.ts` - 超时控制器
- `.cursorrules` - Cursor AI 编程规则
- `CLAUDE.md` - Claude AI 编程助手指南
- `CHANGELOG-v1.0.4.md` - 本文档

### 修改文件
- `src/config/config.ts` - 重构为离线优先架构
- `src/config/types.ts` - 新增 `GetConfigOptions`、`ConfigUpdateOptions`
- `src/index.ts` - 导出新类型和函数
- `package.json` - 版本号更新为 1.0.4
- `README.md` - 新增 v1.0.4 更新日志
- `docs/REFERENCE.md` - 更新 API 速查表和类型定义
- `docs/api-config.md` - 完整重写，新增 v1.0.4 特性说明

---

## 升级建议

### 立即升级场景
- 需要离线支持的应用
- 配置获取频繁的应用
- 大型配置导致 UI 卡顿的应用
- 网络不稳定的环境

### 谨慎升级场景
- 依赖实时配置更新的应用（可配置 `offlineFirst: false`）
- 存储空间受限的环境（可配置 `storeDecryptedData: false`）

### 升级步骤
1. 更新依赖：`npm install @accounthub/sdk@1.0.4`
2. 测试配置获取功能
3. 根据需要调整 `ConfigUpdateOptions`
4. 处理 `TimeoutError`（可选）

---

## 已知问题

无

---

## 下一步计划

- v1.0.5: 支持配置版本控制和增量更新
- v1.1.0: 支持配置订阅和实时推送

---

## 致谢

感谢所有贡献者和用户的反馈！

---

## 相关链接

- [GitHub 仓库](https://github.com/qgming/accounthubsdk)
- [完整文档](https://github.com/qgming/accounthubsdk/tree/main/docs)
- [问题反馈](https://github.com/qgming/accounthubsdk/issues)
