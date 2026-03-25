# AccountHub SDK - Claude AI 编程助手指南

## 项目简介

AccountHub SDK 是一个企业级多应用账户管理 SDK，基于 Supabase 构建，提供完整的用户认证、会员管理、支付集成、配置管理、版本更新、AI 对话和兑换码功能。

**当前版本**: v1.0.5 (2026-03-25)
**技术栈**: TypeScript 5.3, Supabase 2.39, @noble/ciphers, @noble/hashes
**构建工具**: tsup 8.0

---

## v1.0.5 核心变更

### 支付模块重构与显示优化

#### 1. 支付方式简化
- **移除冗余方式**：只支持 `alipay`（支付宝官方）、`wxpay`（微信官方）、`epay`（易支付）
- **类型简化**：`PaymentMethod` 从 5 种减少到 3 种
- **新增配置接口**：`AlipayConfig`、`WxpayConfig`、`EpayConfig`

#### 2. 易支付显示优化
- **自动转换**：SDK 自动将 `payment_method='epay'` + `config.type='wxpay'` 转换为 `display_method='wxpay'`, `display_name='微信支付'`
- **透明处理**：前端无需额外逻辑，用户看到的是熟悉的"微信支付"或"支付宝"
- **新增字段**：`PaymentChannelConfig` 接口新增 `display_method` 和 `display_name` 可选字段

#### 3. 类型安全提升
- 新增 `AlipayConfig` 接口：`app_id`、`gateway`、`private_key`、`public_key`
- 新增 `WxpayConfig` 接口：`app_id`、`mch_id`、`api_key`、`trade_type`
- 新增 `EpayConfig` 接口：`api_url`、`pid`、`key`、`type`

---

### 配置模块性能与离线体验全面升级

#### 1. 离线优先架构
- **持久化缓存**：配置永久缓存到 localStorage/AsyncStorage，离线可用
- **智能更新**：优先返回缓存，后台静默更新（24h 节流，1.2s 超时）
- **指数退避**：网络失败时自动重试，最多 5 次，延迟从 1s 到 60s

#### 2. 异步解密优化
- **Web Worker**：浏览器环境使用 Worker 异步解密，不阻塞主线程
- **setTimeout 分片**：React Native 使用 setTimeout 分片执行
- **新增 API**：`getConfigAsync()`、`batchGetConfigsAsync()`

#### 3. 超时控制
- **统一管理**：`TimeoutController` 提供统一的超时控制
- **独立配置**：手动更新（10s）和后台更新（1.2s）独立超时
- **错误类型**：新增 `TimeoutError` 和 `isTimeoutError()` 判断

#### 4. 缓存元数据
- **完整追踪**：时间戳、更新尝试次数、最后成功更新时间、版本号
- **状态查询**：`getCacheInfo()` 查询缓存状态
- **LRU 策略**：内存缓存最多 100 条，持久化缓存无限制

---

## 项目架构

### 目录结构

```
src/
├── index.ts                    # 主导出文件（所有公共 API）
├── accounthub.ts              # AccountHub 主类（单例模式）
├── core/                      # 核心功能
│   ├── client.ts             # Supabase 客户端管理
│   ├── config.ts             # 全局配置管理器
│   ├── crypto.ts             # 同步加密工具（AES-256-GCM + PBKDF2）
│   ├── crypto-async.ts       # 异步加密工具（Worker/setTimeout）✨ v1.0.4
│   ├── events.ts             # 事件系统（发布订阅）
│   ├── storage.ts            # 存储抽象层（Web/Memory/Custom）
│   └── types.ts              # 核心类型定义
├── auth/                      # 认证模块
│   ├── auth.ts               # 认证主类
│   ├── types.ts              # 认证类型
│   └── errors.ts             # 认证错误
├── membership/                # 会员模块
│   ├── membership.ts         # 会员主类
│   ├── types.ts              # 会员类型
│   └── errors.ts             # 会员错误
├── payment/                   # 支付模块
│   ├── payment.ts            # 支付主类
│   ├── types.ts              # 支付类型
│   └── errors.ts             # 支付错误
├── config/                    # 配置模块 ✨ v1.0.4 重构
│   ├── config.ts             # 配置主类（离线优先）
│   ├── cache-manager.ts      # 持久化缓存管理器 ✨ 新增
│   ├── update-scheduler.ts   # 更新调度器（节流+退避）✨ 新增
│   ├── timeout-controller.ts # 超时控制器 ✨ 新增
│   ├── types.ts              # 配置类型（含 ConfigUpdateOptions）
│   └── errors.ts             # 配置错误
├── update/                    # 更新模块
│   ├── update.ts             # 更新主类
│   ├── version-compare.ts    # 版本比较工具
│   ├── platform.ts           # 平台检测
│   ├── types.ts              # 更新类型
│   └── errors.ts             # 更新错误
├── ai/                        # AI 模块
│   ├── ai.ts                 # AI 主类
│   ├── types.ts              # AI 类型
│   └── errors.ts             # AI 错误
└── redemption/                # 兑换码模块
    ├── redemption.ts         # 兑换码主类
    ├── types.ts              # 兑换码类型
    └── errors.ts             # 兑换码错误
```

### 模块依赖关系

```
AccountHub (主类)
├── Auth (认证)
├── Membership (会员)
├── Payment (支付)
├── Config (配置) ✨ v1.0.4 重构
│   ├── PersistentCacheManager (持久化缓存)
│   ├── UpdateScheduler (更新调度)
│   ├── AsyncCrypto (异步解密)
│   └── TimeoutController (超时控制)
├── Update (更新)
├── AI (AI 对话)
└── RedemptionManager (兑换码)
```

---

## 编码规范

### TypeScript 规范

1. **严格类型**
   - 避免使用 `any`，使用精确的类型定义
   - 所有公共 API 必须有完整的类型注解
   - 使用 `Record<string, unknown>` 代替 `object`

2. **错误处理**
   - 每个模块使用自定义错误类（继承自 `Error`）
   - 错误码使用常量对象（如 `CONFIG_ERROR_CODES`）
   - 错误消息清晰描述问题和解决方案

3. **异步操作**
   - 优先使用 `async/await`，避免回调地狱
   - 长时间操作必须支持超时控制
   - 使用 `Promise.race()` 实现超时

4. **导出规范**
   - 所有公共 API 在 `src/index.ts` 中统一导出
   - 类型定义使用 `export type`
   - 工具函数使用 `export { ... }`

### 配置模块特殊规范（v1.0.4）

1. **缓存策略**
   ```typescript
   // 内存缓存：最多 100 条，LRU 淘汰
   private static readonly MAX_CACHE_SIZE = 100;

   // 持久化缓存：无限制，永不过期
   // 格式：accounthub_config_data:<configKey>
   //       accounthub_config_meta:<configKey>
   ```

2. **解密策略**
   ```typescript
   // 浏览器：优先使用 Web Worker 异步解密
   if (typeof Worker !== 'undefined') {
     // 使用 Worker
   } else {
     // 降级到 setTimeout 分片
   }
   ```

3. **超时控制**
   ```typescript
   // 手动更新：默认 10s 超时
   manualUpdateTimeoutMs: 10000

   // 后台更新：默认 1.2s 超时
   backgroundUpdateTimeoutMs: 1200
   ```

4. **更新调度**
   ```typescript
   // 节流：24h 内不重复更新
   updateThrottleMs: 24 * 60 * 60 * 1000

   // 退避：指数退避，最多 5 次
   retryBackoff: {
     initialDelayMs: 1000,
     maxDelayMs: 60000,
     multiplier: 2,
     maxRetries: 5,
   }
   ```

### 加密规范

1. **算法**
   - 对称加密：AES-256-GCM
   - 密钥派生：PBKDF2-SHA256（10 万次迭代）
   - 随机数：12 字节 nonce

2. **格式**
   ```typescript
   // 加密配置格式
   {
     _enc: "enc:v1:<hex(nonce)>.<hex(ciphertext+authTag)>"
   }

   // 密钥派生
   key = PBKDF2(appKey, appId, 100000, 32)
   ```

3. **缓存**
   - 派生密钥在实例生命周期内缓存
   - 避免重复 PBKDF2 计算（耗时 ~100ms）

---

## 关键 API 使用示例

### 初始化（v1.0.4）

```typescript
import { initializeAccountHub } from "@accounthub/sdk";

const sdk = initializeAccountHub({
  supabaseUrl: "https://your-project.supabase.co",
  supabaseAnonKey: "your-anon-key",
  appId: "your-app-uuid",
  appKey: "your-app-key",
  options: {
    // v1.0.4 新增：配置更新策略
    configUpdateOptions: {
      offlineFirst: true,                      // 离线优先
      updateThrottleMs: 24 * 60 * 60 * 1000,  // 24h 节流
      backgroundUpdateTimeoutMs: 1200,         // 1.2s 超时
      manualUpdateTimeoutMs: 10000,            // 10s 超时
      useWorkerForDecryption: true,            // 使用 Worker
      retryBackoff: {
        initialDelayMs: 1000,
        maxDelayMs: 60000,
        multiplier: 2,
        maxRetries: 5,
      },
    },
  },
});
```

### 配置模块（v1.0.4）

```typescript
// 1. 离线优先（默认行为）
const config = await sdk.config.getConfig("announcement");
// 流程：内存缓存 → 持久化缓存 → 立即返回 → 后台更新

// 2. 强制刷新（忽略节流）
const config = await sdk.config.getConfig("announcement", {
  forceRefresh: true,
});

// 3. 异步解密（不阻塞 UI）
const config = await sdk.config.getConfigAsync("llm_config");

// 4. 批量异步获取
const configs = await sdk.config.batchGetConfigsAsync([
  "announcement",
  "llm_config",
  "api_config",
]);

// 5. 查询缓存状态
const info = await sdk.config.getCacheInfo("announcement");
console.log(info.hasCache, info.metadata, info.dataSize);

// 6. 降级默认值
const config = await sdk.config.getConfig("announcement", {
  fallbackValue: {
    id: "default",
    config_key: "announcement",
    config_data: { title: "默认公告" },
    // ... 其他字段
  },
});

// 7. 超时错误处理
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

## 测试与调试

### 类型检查

```bash
npm run type-check
```

### 构建测试

```bash
npm run build
# 检查 dist/ 目录：
# - dist/index.js (CJS)
# - dist/index.mjs (ESM)
# - dist/index.d.ts (类型定义)
```

### 缓存调试

```typescript
// 查询缓存状态
const info = await sdk.config.getCacheInfo("announcement");
console.log(info);

// 清除缓存
sdk.config.clearCache("announcement");  // 清除单个
sdk.config.clearCache();                // 清除所有
```

---

## 文档维护

修改代码时，必须同步更新以下文档：

1. **README.md**
   - 更新日志（版本号、日期、变更内容）
   - 快速开始示例
   - 破坏性变更说明

2. **docs/REFERENCE.md**
   - API 速查表
   - 类型定义
   - 错误码汇总

3. **docs/api-*.md**
   - 对应模块的详细文档
   - 新增 API 说明
   - 使用示例

4. **package.json**
   - 版本号（遵循语义化版本）

5. **.cursorrules / CLAUDE.md**
   - 项目概述
   - 最新变更
   - 编码规范

---

## 发布流程

```bash
# 1. 更新版本号
# 编辑 package.json: "version": "1.0.4"

# 2. 更新文档
# 编辑 README.md, docs/REFERENCE.md, docs/api-*.md

# 3. 类型检查
npm run type-check

# 4. 构建
npm run build

# 5. 发布
npm publish --access public
```

---

## 常见问题

### Q: 如何保持 v1.0.3 的行为（每次查询数据库）？

```typescript
const sdk = initializeAccountHub({
  // ...
  options: {
    configUpdateOptions: {
      offlineFirst: false,  // 禁用离线优先
    },
  },
});
```

### Q: 如何调整更新节流时间？

```typescript
configUpdateOptions: {
  updateThrottleMs: 12 * 60 * 60 * 1000,  // 改为 12h
}
```

### Q: 如何禁用 Web Worker 解密？

```typescript
configUpdateOptions: {
  useWorkerForDecryption: false,  // 降级到 setTimeout 分片
}
```

### Q: 如何处理超时错误？

```typescript
import { isTimeoutError } from "@accounthub/sdk";

try {
  const config = await sdk.config.getConfig("announcement");
} catch (error) {
  if (isTimeoutError(error)) {
    // 超时处理：使用缓存或默认值
    const cached = await sdk.config.getCacheInfo("announcement");
    if (cached.hasCache) {
      // 使用缓存数据
    }
  }
}
```

---

## 相关链接

- [GitHub 仓库](https://github.com/qgming/accounthubsdk)
- [AccountHub 管理后台](https://github.com/qgming/accounthub)
- [Supabase 文档](https://supabase.com/docs)
- [@noble/ciphers](https://github.com/paulmillr/noble-ciphers)
- [@noble/hashes](https://github.com/paulmillr/noble-hashes)

---

## 注意事项

1. **破坏性变更**：v1.0.4 改变了配置模块的默认行为，必须在文档中明确标注
2. **类型导出**：所有公共类型必须在 `src/index.ts` 中导出
3. **错误处理**：新增错误码必须在对应的 `errors.ts` 中定义
4. **缓存管理**：修改缓存逻辑时注意 LRU 策略和内存泄漏
5. **异步操作**：涉及加密解密的操作优先使用异步方法
6. **向后兼容**：提供配置选项保持旧版本行为
