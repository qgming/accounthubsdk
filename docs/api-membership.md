# Membership 模块 API

`accountHub.membership` — 会员创建、状态管理、过期检查、取消。

---

## 会员状态

```typescript
type MembershipStatus = "active" | "inactive" | "expired";
```

> ⚠️ v1.0.2 起移除了 `"trial"` / `"suspended"` / `"cancelled"`，与数据库 CHECK 约束对齐。

---

## 方法列表

### `getUserMembership(userId)`

获取用户当前会员信息。

```typescript
const membership = await accountHub.membership.getUserMembership(userId);
// 返回: UserMembership | null
```

---

### `createMembership(userId, options?)`

创建会员记录。若会员已存在（数据库唯一约束 23505），抛出 `MEMBERSHIP_ERROR_CODES.ALREADY_EXISTS`。

```typescript
const membership = await accountHub.membership.createMembership(userId, {
  trialDays: 7,                    // 试用天数（覆盖全局配置）
  billingCycle: "monthly",         // 'monthly' | 'yearly'
  membershipPlanId: "plan-uuid",   // 关联套餐 ID（可选）
  metadata: { source: "web" },     // 自定义元数据（可选）
});
```

**初始状态**：`"inactive"`（无试用期）或 `"active"`（有试用期）

---

### `updateMembership(userId, updates)`

更新会员完整信息。

```typescript
await accountHub.membership.updateMembership(userId, {
  status: "active",
  expiresAt: "2025-12-31T23:59:59Z",
  billingCycle: "yearly",
});
```

---

### `updateMembershipStatus(userId, status)`

快速更新会员状态。

```typescript
await accountHub.membership.updateMembershipStatus(userId, "active");
// status: 'active' | 'inactive' | 'expired'
```

---

### `cancelMembership(userId)`

取消会员（状态设为 `"inactive"`）。

```typescript
await accountHub.membership.cancelMembership(userId);
```

---

### `isMembershipActive(userId)`

检查会员是否激活。

```typescript
const isActive = await accountHub.membership.isMembershipActive(userId);
// 返回: boolean
```

---

### `getMembershipExpiryDate(userId)`

获取会员过期时间。

```typescript
const expiryDate = await accountHub.membership.getMembershipExpiryDate(userId);
// 返回: Date | null
```

---

## 错误码

```typescript
import { MembershipError, MEMBERSHIP_ERROR_CODES } from "@accounthub/sdk";

MEMBERSHIP_ERROR_CODES.NOT_FOUND      // 会员记录不存在
MEMBERSHIP_ERROR_CODES.ALREADY_EXISTS // 会员已存在（createMembership 重复调用）
MEMBERSHIP_ERROR_CODES.EXPIRED        // 会员已过期
MEMBERSHIP_ERROR_CODES.UNKNOWN        // 未知错误
```

---

## 相关事件

```typescript
// membership 类型为 UserMembership
accountHub.events.on("membership:created",   ({ membership }) => {});
accountHub.events.on("membership:updated",   ({ membership }) => {});
accountHub.events.on("membership:cancelled", ({ membership }) => {});
```

---

## UserMembership 类型

```typescript
interface UserMembership {
  id: string;
  user_id: string;
  application_id: string;
  status: MembershipStatus;          // 'active' | 'inactive' | 'expired'
  billing_cycle: string | null;      // 'monthly' | 'yearly'
  membership_plan_id: string | null;
  expires_at: string | null;         // ISO 8601 时间字符串
  auto_renew: boolean | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}
```
