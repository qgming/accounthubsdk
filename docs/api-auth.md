# Auth 模块 API

`accountHub.auth` — 用户认证，包含注册、登录、OTP 验证、资料管理、状态监听。

---

## 方法列表

### `signUp(params)`

注册新用户。

```typescript
const { user, needsVerification } = await accountHub.auth.signUp({
  email: "user@example.com",
  password: "password123",
  fullName: "张三",        // 可选
});

// needsVerification 为 true 时需调用 verifyOtp
if (needsVerification) {
  await accountHub.auth.verifyOtp("user@example.com", "123456", "张三");
}
```

**返回**：`{ user: User, needsVerification: boolean }`

---

### `verifyOtp(email, token, fullName?)`

验证 OTP 邮箱验证码（注册后调用）。

```typescript
await accountHub.auth.verifyOtp("user@example.com", "123456", "张三");
```

---

### `signIn(params)`

用户登录。

```typescript
const { user, session } = await accountHub.auth.signIn({
  email: "user@example.com",
  password: "password123",
});
```

**返回**：`{ user: User, session: Session }`

**抛出**：
- `AUTH_ERROR_CODES.INVALID_CREDENTIALS` — 邮箱或密码错误
- `AUTH_ERROR_CODES.USER_BANNED` — 账户已封禁
- `AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED` — 邮箱未验证

---

### `signOut()`

退出登录。

```typescript
await accountHub.auth.signOut();
```

---

### `getCurrentUser()`

获取当前登录用户。

```typescript
const user = await accountHub.auth.getCurrentUser();
// 返回: User | null
```

---

### `updatePassword(newPassword)`

更新密码（需已登录）。

```typescript
await accountHub.auth.updatePassword("newPassword123");
```

---

### `updateProfile(updates)`

更新用户资料。

```typescript
await accountHub.auth.updateProfile({
  fullName: "李四",
  avatarUrl: "https://example.com/avatar.jpg",
});
```

---

### `onAuthStateChange(callback)`

监听认证状态变化。返回取消订阅函数，组件卸载时必须调用。

```typescript
const unsubscribe = accountHub.auth.onAuthStateChange((user) => {
  // user: User | null
  if (user) {
    console.log("已登录:", user.email);
  }
});

// 清理
unsubscribe();
```

---

## 错误码

```typescript
import { AuthError, AUTH_ERROR_CODES } from "@accounthub/sdk";

AUTH_ERROR_CODES.INVALID_CREDENTIALS  // 邮箱或密码错误
AUTH_ERROR_CODES.USER_BANNED          // 账户已封禁
AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED  // 邮箱未验证
AUTH_ERROR_CODES.USER_NOT_FOUND       // 用户不存在
AUTH_ERROR_CODES.UNKNOWN              // 未知错误
```

---

## 相关事件

```typescript
accountHub.events.on("auth:signin",      ({ userId }) => {});
accountHub.events.on("auth:signout",     () => {});
accountHub.events.on("auth:statechange", ({ user }) => {}); // user: User | null
```
