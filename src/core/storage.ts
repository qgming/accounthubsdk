export type { StorageAdapter } from './types';

// 声明全局类型以支持浏览器和 Node.js 环境
declare const globalThis: {
  localStorage?: Storage;
};

/**
 * Web 存储适配器（使用 localStorage）
 */
export class WebStorage {
  getItem(key: string): string | null {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage.getItem(key);
    }
    return null;
  }

  setItem(key: string, value: string): void {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      globalThis.localStorage.setItem(key, value);
    }
  }

  removeItem(key: string): void {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      globalThis.localStorage.removeItem(key);
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
