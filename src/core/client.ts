import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';
import type { StorageAdapter } from './storage';

let supabaseClient: SupabaseClient | null = null;

/**
 * 创建 Supabase 客户端（单例模式）
 * @param url Supabase URL
 * @param anonKey Supabase 匿名密钥
 * @param storage 存储适配器
 * @returns Supabase 客户端实例
 */
export function createSupabaseClient(
  url: string,
  anonKey: string,
  storage: StorageAdapter
): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey, {
      auth: {
        storage: storage as SupportedStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * 获取 Supabase 客户端实例
 * @returns Supabase 客户端实例
 * @throws {Error} 如果客户端未初始化
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase 客户端未初始化。请先调用 createSupabaseClient()');
  }
  return supabaseClient;
}

/**
 * 重置 Supabase 客户端（主要用于测试）
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}
