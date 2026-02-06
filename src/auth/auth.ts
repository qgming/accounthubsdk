import { getSupabaseClient } from '../core/client';
import { configManager } from '../core/config';
import type { EventEmitter } from '../core/events';
import type { User } from '../core/types';
import type {
  SignUpData,
  SignInData,
  SignUpResult,
  SignInResult,
  VerifyOtpResult,
  UpdateProfileData,
} from './types';
import { AuthError, AUTH_ERROR_CODES } from './errors';

/**
 * 认证模块
 */
export class Auth {
  constructor(private events: EventEmitter) {}

  /**
   * 用户注册
   * @param data 注册数据
   * @returns 注册结果
   */
  async signUp(data: SignUpData): Promise<SignUpResult> {
    try {
      const supabase = getSupabaseClient();
      const config = configManager.getConfig();

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            registered_from_app_id: config.appId,
          },
        },
      });

      if (error) {
        throw new AuthError(error.message, AUTH_ERROR_CODES.SIGNUP_FAILED, error);
      }

      // 确保在 public.users 表中创建用户记录（双重保障）
      if (authData.user) {
        try {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              full_name: data.fullName,
              registered_from_app_id: config.appId,
            })
            .select()
            .single();

          // 如果插入失败但不是因为重复键（触发器已创建），则记录错误
          if (insertError && !insertError.message.includes('duplicate key')) {
            console.error('创建 public.users 记录失败:', insertError);
          }
        } catch (insertError) {
          // 记录错误但不影响注册流程
          console.error('创建 public.users 记录失败:', insertError);
        }

        this.events.emit('auth:signup', { userId: authData.user.id });
      }

      return {
        user: authData.user,
        needsVerification: !authData.session,
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        '注册失败',
        AUTH_ERROR_CODES.SIGNUP_FAILED,
        error
      );
    }
  }

  /**
   * 用户登录
   * @param data 登录数据
   * @returns 登录结果
   */
  async signIn(data: SignInData): Promise<SignInResult> {
    try {
      const supabase = getSupabaseClient();

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw new AuthError(error.message, AUTH_ERROR_CODES.SIGNIN_FAILED, error);
      }

      if (!authData.user || !authData.session) {
        throw new AuthError(
          '用户名或密码错误',
          AUTH_ERROR_CODES.INVALID_CREDENTIALS
        );
      }

      // 检查账号是否被封禁
      const isBanned = await this.checkUserBanned(authData.user.id);
      if (isBanned) {
        // 如果账号被封禁，立即登出
        await supabase.auth.signOut();
        throw new AuthError(
          '账号已被封禁，无法登录',
          AUTH_ERROR_CODES.ACCOUNT_BANNED
        );
      }

      this.events.emit('auth:signin', { userId: authData.user.id });

      return {
        user: authData.user,
        session: authData.session,
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        '登录失败',
        AUTH_ERROR_CODES.SIGNIN_FAILED,
        error
      );
    }
  }

  /**
   * 用户登出
   */
  async signOut(): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new AuthError(error.message, AUTH_ERROR_CODES.SIGNOUT_FAILED, error);
      }

      this.events.emit('auth:signout', {});
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        '登出失败',
        AUTH_ERROR_CODES.SIGNOUT_FAILED,
        error
      );
    }
  }

  /**
   * 验证 OTP
   * @param email 邮箱
   * @param token OTP 令牌
   * @param fullName 用户全名（可选）
   * @returns 验证结果
   */
  async verifyOtp(
    email: string,
    token: string,
    fullName?: string
  ): Promise<VerifyOtpResult> {
    try {
      const supabase = getSupabaseClient();

      const { data: authData, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        throw new AuthError(
          error.message,
          AUTH_ERROR_CODES.VERIFY_OTP_FAILED,
          error
        );
      }

      if (!authData.user || !authData.session) {
        throw new AuthError(
          'OTP 验证失败',
          AUTH_ERROR_CODES.VERIFY_OTP_FAILED
        );
      }

      // 如果提供了全名，更新用户资料
      if (fullName) {
        await this.updateProfile({ fullName });
      }

      return {
        user: authData.user,
        session: authData.session,
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        '验证 OTP 失败',
        AUTH_ERROR_CODES.VERIFY_OTP_FAILED,
        error
      );
    }
  }

  /**
   * 发送重置密码验证码
   * @param email 邮箱
   */
  async sendPasswordResetOtp(email: string): Promise<void> {
    try {
      const config = configManager.getConfig();
      if (!config.options?.enablePasswordReset) {
        throw new AuthError(
          '密码重置功能已禁用',
          AUTH_ERROR_CODES.RESET_PASSWORD_FAILED
        );
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: config.options?.defaultReturnUrl,
      });

      if (error) {
        throw new AuthError(
          error.message,
          AUTH_ERROR_CODES.RESET_PASSWORD_FAILED,
          error
        );
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        '发送密码重置验证码失败',
        AUTH_ERROR_CODES.RESET_PASSWORD_FAILED,
        error
      );
    }
  }

  /**
   * 验证重置密码的OTP并设置新密码
   * @param email 邮箱
   * @param token OTP令牌
   * @param newPassword 新密码
   */
  async verifyPasswordResetOtp(
    email: string,
    token: string,
    newPassword: string
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient();

      // 验证OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });

      if (verifyError) {
        throw new AuthError(
          verifyError.message,
          AUTH_ERROR_CODES.VERIFY_OTP_FAILED,
          verifyError
        );
      }

      // 更新密码
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new AuthError(
          updateError.message,
          AUTH_ERROR_CODES.UPDATE_PASSWORD_FAILED,
          updateError
        );
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        '验证 OTP 并重置密码失败',
        AUTH_ERROR_CODES.RESET_PASSWORD_FAILED,
        error
      );
    }
  }

  /**
   * 更新密码
   * @param newPassword 新密码
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new AuthError(
          error.message,
          AUTH_ERROR_CODES.UPDATE_PASSWORD_FAILED,
          error
        );
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        '更新密码失败',
        AUTH_ERROR_CODES.UPDATE_PASSWORD_FAILED,
        error
      );
    }
  }

  /**
   * 更新用户资料
   * @param data 更新数据
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    try {
      const supabase = getSupabaseClient();

      // 1. 更新 auth.users 的 raw_user_meta_data
      const { data: userData, error } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          avatar_url: data.avatarUrl,
        },
      });

      if (error || !userData.user) {
        throw new AuthError(
          error?.message || '更新用户资料失败',
          AUTH_ERROR_CODES.UPDATE_PROFILE_FAILED,
          error
        );
      }

      // 2. 同步更新 public.users 表
      try {
        const updateData: { full_name?: string; avatar_url?: string; updated_at: string } = {
          updated_at: new Date().toISOString(),
        };

        if (data.fullName !== undefined) {
          updateData.full_name = data.fullName;
        }

        if (data.avatarUrl !== undefined) {
          updateData.avatar_url = data.avatarUrl;
        }

        const { error: publicUserError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userData.user.id);

        if (publicUserError) {
          // 记录错误但不抛出，因为 auth.users 已经更新成功
          console.error('同步用户资料到 public.users 失败:', publicUserError);
        }
      } catch (syncError) {
        // 记录同步错误但不影响主流程
        console.error('同步用户资料到 public.users 失败:', syncError);
      }

      return userData.user;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        '更新用户资料失败',
        AUTH_ERROR_CODES.UPDATE_PROFILE_FAILED,
        error
      );
    }
  }

  /**
   * 获取当前用户
   * @returns 当前用户或 null
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        // 如果是 session missing 错误，返回 null 而不是抛出异常
        if (error.message.includes('session') || error.message.includes('Auth session missing') || error.message.includes('认证会话缺失')) {
          return null;
        }
        throw new AuthError(
          error.message,
          AUTH_ERROR_CODES.GET_USER_FAILED,
          error
        );
      }

      return data.user;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        '获取当前用户失败',
        AUTH_ERROR_CODES.GET_USER_FAILED,
        error
      );
    }
  }

  /**
   * 监听认证状态变化
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const supabase = getSupabaseClient();
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user || null;
        callback(user);
        this.events.emit('auth:statechange', { user });
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }

  /**
   * 检查用户是否被封禁
   * @param userId 用户 ID
   * @returns 是否被封禁
   */
  async checkUserBanned(userId: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('users')
        .select('is_banned')
        .eq('id', userId)
        .single();

      if (error) {
        // 如果查询失败，为了安全起见返回 false（允许登录）
        console.error('检查用户封禁状态失败:', error);
        return false;
      }

      return data?.is_banned === true;
    } catch (error) {
      // 如果发生异常，为了安全起见返回 false（允许登录）
      console.error('检查用户封禁状态失败:', error);
      return false;
    }
  }
}
