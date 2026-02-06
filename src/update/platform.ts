import type { Platform } from './types';

// 声明全局类型以支持浏览器和 Node.js 环境
declare const globalThis: {
  navigator?: Navigator;
};

/**
 * 检测当前平台
 * @returns 平台类型
 */
export function detectPlatform(): Platform {
  // 浏览器环境
  if (typeof globalThis !== 'undefined' && globalThis.navigator) {
    const userAgent = globalThis.navigator.userAgent.toLowerCase();

    if (/android/.test(userAgent)) {
      return 'android';
    }
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    }
    if (/win/.test(userAgent)) {
      return 'windows';
    }
    if (/mac/.test(userAgent)) {
      return 'macos';
    }
    if (/linux/.test(userAgent)) {
      return 'linux';
    }

    return 'web';
  }

  // Node.js 环境
  if (typeof process !== 'undefined' && process.platform) {
    switch (process.platform) {
      case 'win32':
        return 'windows';
      case 'darwin':
        return 'macos';
      case 'linux':
        return 'linux';
      default:
        return 'unknown';
    }
  }

  return 'unknown';
}
