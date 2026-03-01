export type { StorageAdapter } from './types';

// 声明全局类型以支持浏览器和 Node.js 环境
declare const globalThis: {
  localStorage?: Storage;
};

/**
 * Web 存储适配器（使用 localStorage）
 * 所有操作均包装在 try-catch 中，防止隐私模式或 SSR 环境下抛出未捕获异常
 */
export class WebStorage {
  getItem(key: string): string | null {
    try {
      if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
        return globalThis.localStorage.getItem(key);
      }
    } catch {
      // 隐私模式或 SSR 环境下 localStorage 可能抛出异常，静默忽略
    }
    return null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
        globalThis.localStorage.setItem(key, value);
      }
    } catch {
      // 存储空间不足或隐私模式下可能抛出异常，静默忽略
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
        globalThis.localStorage.removeItem(key);
      }
    } catch {
      // 静默忽略
    }
  }
}

/**
 * 内存存储适配器（用于 React Native 或无 localStorage 环境）
 */
export class MemoryStorage {
  private storage: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }
}

// 默认存储适配器
export const defaultStorage = new WebStorage();
