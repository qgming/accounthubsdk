export const CONFIG_ERROR_CODES = {
  GET_FAILED: 'CONFIG_GET_FAILED',
  NOT_FOUND: 'CONFIG_NOT_FOUND',
  INACTIVE: 'CONFIG_INACTIVE',
  INVALID_KEY: 'CONFIG_INVALID_KEY',
} as const

export class ConfigError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message)
    this.name = 'ConfigError'
  }
}
