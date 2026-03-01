# Redemption 模块 API

`accountHub.redemption` — 兑换码验证、兑换、历史记录查询。

---

## 方法列表

### `redeemCode(code)`

兑换码兑换（实际消耗一次使用次数，并写入兑换记录）。

```typescript
try {
  const result = await accountHub.redemption.redeemCode("XXXX-XXXX-XXXX-XXXX");

  if (result.success) {
    console.log("兑换成功:", result.message);
    console.log("会员 ID:", result.data?.membershipId);
    console.log("过期时间:", result.data?.expiresAt);   // ISO 8601 字符串
  }
} catch (error) {
  if (error instanceof RedemptionError) {
    // 见错误码章节
  }
}
```

**返回**：

```typescript
interface RedemptionResult {
  success: boolean;
  message: string;
  data?: {
    membershipId: string;
    expiresAt: string;
  };
}
```

---

### `validateCode(code)`

验证兑换码是否有效（不实际兑换，不消耗次数）。

```typescript
const info = await accountHub.redemption.validateCode("XXXX-XXXX-XXXX-XXXX");
// 返回: RedemptionCodeInfo
```

```typescript
interface RedemptionCodeInfo {
  code: string;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  duration_days: number | null;
}
```

---

### `getUserRedemptions()`

获取当前登录用户的兑换记录列表。

```typescript
const records = await accountHub.redemption.getUserRedemptions();
// 返回: RedemptionCodeUse[]
```

```typescript
interface RedemptionCodeUse {
  id: string;
  code_id: string;
  user_id: string;
  application_id: string;
  redeemed_at: string;
  membership_id: string | null;
}
```

---

## 错误码

```typescript
import { RedemptionError, RedemptionErrorCode } from "@accounthub/sdk";

try {
  await accountHub.redemption.redeemCode(code);
} catch (error) {
  if (error instanceof RedemptionError) {
    switch (error.code) {
      case RedemptionErrorCode.CODE_NOT_FOUND:
        // 兑换码不存在
        break;
      case RedemptionErrorCode.CODE_EXPIRED:
        // 兑换码已过期
        break;
      case RedemptionErrorCode.CODE_EXHAUSTED:
        // 兑换码使用次数已耗尽
        break;
      case RedemptionErrorCode.CODE_ALREADY_USED:
        // 当前用户已使用过此兑换码
        break;
      case RedemptionErrorCode.USER_NOT_AUTHENTICATED:
        // 用户未登录
        break;
      case RedemptionErrorCode.SERVER_ERROR:
        // 服务器错误
        break;
    }
  }
}
```
