/**
 * 版本比较工具函数
 */

/**
 * 比较两个版本号
 * @param v1 版本号 1
 * @param v2 版本号 2
 * @returns 1 表示 v1 > v2, -1 表示 v1 < v2, 0 表示相等
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * 检查版本 1 是否大于版本 2
 */
export function isVersionGreater(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) > 0;
}

/**
 * 检查版本 1 是否小于版本 2
 */
export function isVersionLess(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) < 0;
}

/**
 * 检查两个版本是否相等
 */
export function isVersionEqual(v1: string, v2: string): boolean {
  return compareVersions(v1, v2) === 0;
}
