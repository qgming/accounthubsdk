export { Update } from './update';
export type {
  Platform,
  VersionInfo,
  UpdateCheckResult,
  CheckUpdateOptions,
  CachedUpdateInfo,
} from './types';
export { UpdateError, UPDATE_ERROR_CODES } from './errors';
export {
  compareVersions,
  isVersionGreater,
  isVersionLess,
  isVersionEqual,
} from './version-compare';
export { detectPlatform } from './platform';
