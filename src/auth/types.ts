/**
 * 认证相关类型定义
 */

import type { User, Session } from '@supabase/supabase-js';

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
  session: Session;
}

// OTP 验证结果
export interface VerifyOtpResult {
  user: User;
  session: Session;
}

// 更新用户资料数据
export interface UpdateProfileData {
  fullName?: string;
  avatarUrl?: string;
}
