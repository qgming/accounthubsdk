# Payment 模块 API

`accountHub.payment` — 会员套餐查询、支付会话创建、支付状态验证、支付渠道管理。

---

## 方法列表

### `getMembershipPlans()`

获取当前应用所有会员套餐。

```typescript
const plans = await accountHub.payment.getMembershipPlans();
// 返回: MembershipPlan[]
```

---

### `getMembershipPlan(planId)`

获取单个套餐详情。

```typescript
const plan = await accountHub.payment.getMembershipPlan("plan-uuid");
// 返回: MembershipPlan | null
```

---

### `createMembershipCheckoutSession(userId, planId, channelId, options?)`

创建支付会话（推荐使用，自动组合套餐+渠道+支付记录）。

```typescript
const session = await accountHub.payment.createMembershipCheckoutSession(
  userId,
  "plan-uuid",
  "channel-uuid",
  {
    returnUrl: "myapp://payment/callback",  // 支付完成回调（移动端必填）
    metadata: { source: "mobile" },         // 自定义元数据（可选）
  },
);

console.log(session.sessionId);   // 支付会话 ID
console.log(session.paymentId);   // 支付记录 ID
console.log(session.paymentUrl);  // 跳转支付链接
```

**返回**：`CheckoutSession`

```typescript
interface CheckoutSession {
  sessionId: string;
  paymentId: string;
  paymentUrl: string;
}
```

---

### `verifyPaymentBySessionId(sessionId)`

验证支付是否成功。

```typescript
const isPaid = await accountHub.payment.verifyPaymentBySessionId(sessionId);
// 返回: boolean
```

---

### `getPaymentBySessionId(sessionId)`

获取支付记录详情。

```typescript
const payment = await accountHub.payment.getPaymentBySessionId(sessionId);
if (payment) {
  console.log(payment.status);  // 'success' | 'failed' | 'pending' | 'refunded'
  console.log(payment.amount);
}
// 返回: PaymentRecord | null
```

---

### `getPaymentChannels()`

获取当前应用所有支付渠道。

```typescript
const channels = await accountHub.payment.getPaymentChannels();
// 返回: PaymentChannelConfig[]
```

---

### `getPaymentChannel(channelId)`

获取单个支付渠道配置。

```typescript
const channel = await accountHub.payment.getPaymentChannel("channel-uuid");
// 返回: PaymentChannelConfig | null
```

---

## 类型定义

```typescript
// 支付渠道配置
interface PaymentChannelConfig {
  id: string;
  application_id: string | null;
  payment_method: string;            // 'stripe' | 'alipay' | 'wechat' | 'yipay'
  config: Record<string, unknown>;   // 渠道私有配置（API Key 等）
  is_active: boolean | null;
  is_sandbox: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// 会员套餐
interface MembershipPlan {
  id: string;
  application_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_cycle: string;             // 'monthly' | 'yearly'
  features: Record<string, unknown> | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}
```

---

## 错误码

```typescript
import { PaymentError, PAYMENT_ERROR_CODES } from "@accounthub/sdk";

PAYMENT_ERROR_CODES.PLAN_NOT_FOUND     // 套餐不存在
PAYMENT_ERROR_CODES.CHANNEL_NOT_FOUND  // 支付渠道不存在
PAYMENT_ERROR_CODES.PAYMENT_FAILED     // 支付失败
PAYMENT_ERROR_CODES.UNKNOWN            // 未知错误
```

---

## 相关事件

```typescript
accountHub.events.on("payment:created",   ({ paymentId }) => {});
accountHub.events.on("payment:completed", ({ paymentId }) => {});
accountHub.events.on("payment:failed",    ({ paymentId, error }) => {});
```
