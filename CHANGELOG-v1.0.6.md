# AccountHub SDK v1.0.6 更新日志

**发布日期**: 2026-03-25

---

## 概述

v1.0.6 聚焦支付成功链路的一致性修复，补齐了 SDK 支付记录中的 `session_id` 字段，便于前端在支付完成回跳后按会话维度校验订单状态，并与云端支付回调处理保持一致。

---

## 核心变更

### 支付记录类型补齐 `session_id`

文件：`src/payment/types.ts`

- 在 `PaymentRecord` 中新增 `session_id?: string | null`
- 让 SDK 能正确表达云端 `payment_history.session_id` 字段
- 便于业务端通过 `getPaymentBySessionId()` / `verifyPaymentBySessionId()` 查询支付结果

```typescript
export interface PaymentRecord {
  id: string;
  membership_id: string | null;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod | null;
  transaction_id: string | null;
  status: PaymentStatus;
  invoice_url: string | null;
  paid_at: string | null;
  created_at: string;
  application_id: string | null;
  metadata: Record<string, any> | null;
  session_id?: string | null;
}
```

---

## 变更原因

此前云端支付创建与回调流程已经开始依赖 `session_id` 作为支付会话的稳定查询键，但 SDK 的 `PaymentRecord` 类型中缺少该字段，会导致：

- 类型定义与数据库结构不一致
- 前端按会话查询支付状态时类型提示不完整
- 支付成功页、回跳页、异步通知之间的字段对齐不够清晰

本次修复后，SDK 在类型层面与当前支付链路保持一致。

---

## 文件变更

### 修改文件
- `src/payment/types.ts` - 为 `PaymentRecord` 新增 `session_id` 字段
- `package.json` - 版本号更新为 `1.0.6`
- `CHANGELOG-v1.0.6.md` - 新增本次更新日志

---

## 升级建议

### 建议升级场景
- 已接入支付模块，并通过支付回跳页确认订单状态
- 需要按会话 ID 查询支付状态
- 需要让 SDK 类型与当前云端支付实现保持一致

### 升级步骤
1. 更新依赖：`npm install @accounthub/sdk@1.0.6`
2. 如业务端有读取 `PaymentRecord` 的逻辑，可直接开始使用 `session_id`
3. 如支付成功页基于会话 ID 查询状态，建议统一使用 `getPaymentBySessionId()`

---

## 兼容性

本次为向后兼容更新：
- 未移除旧字段
- 未修改已有方法签名
- 仅新增类型字段，不影响现有调用
