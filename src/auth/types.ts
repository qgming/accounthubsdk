/**
 * 认证相关类型定义
 */

import type { User } from '../core/types';

// 注册数据
export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

// 登录数据
export interface SignInData {
  email: string;
  password: string;
}

// 注册结果
export interface SignUpResult {
  user: User | null;
  needsVerification: boolean;
}

// 登录结果
export interface SignInResult {
  user: User;
  session: any;
}

// OTP 验证结果
export interface VerifyOtpResult {
  user: User;
  session: any;
}

// 更新用户资料数据
export interface UpdateProfileData {
  fullName?: string;
  avatarUrl?: string;
}
