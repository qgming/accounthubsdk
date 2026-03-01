import { gcm } from '@noble/ciphers/aes'
import { pbkdf2 } from '@noble/hashes/pbkdf2'
import { sha256 } from '@noble/hashes/sha256'
import { randomBytes, utf8ToBytes, bytesToUtf8 } from '@noble/hashes/utils'
import { bytesToHex, hexToBytes } from '@noble/ciphers/utils'

// 加密前缀标识符，用于判断字段是否已加密
const ENC_PREFIX = 'enc:v1:'

/**
 * 从 appKey + appId 派生 AES-256-GCM 密钥
 * 使用 PBKDF2-SHA256，100000 次迭代，输出 32 字节密钥
 * 同步操作，结果需缓存避免重复计算
 */
export function deriveKey(appKey: string, appId: string): Uint8Array {
  const keyMaterial = utf8ToBytes(appKey)
  const salt = utf8ToBytes(appId)
  return pbkdf2(sha256, keyMaterial, salt, { c: 100_000, dkLen: 32 })
}

/**
 * 加密整个 config_data 对象
 * 将整个对象序列化为 JSON 后加密，返回含 _enc 字段的包装对象
 * 格式：{ _enc: "enc:v1:<hex(nonce)>.<hex(ciphertext+authTag)>" }
 */
export function encryptConfigData(
  configData: Record<string, unknown>,
  key: Uint8Array
): Record<string, unknown> {
  const plaintext = utf8ToBytes(JSON.stringify(configData))
  const nonce = randomBytes(12) // AES-GCM 推荐 96-bit nonce
  const aes = gcm(key, nonce)
  const ciphertext = aes.encrypt(plaintext) // 含 16 字节 authTag
  const encoded = `${ENC_PREFIX}${bytesToHex(nonce)}.${bytesToHex(ciphertext)}`
  return { _enc: encoded }
}

/**
 * 解密 config_data
 * 检测 _enc 字段，如存在则解密还原原始对象
 * 无 _enc 字段（旧数据）则原样返回，保持向后兼容
 */
export function decryptConfigData(
  configData: Record<string, unknown>,
  key: Uint8Array
): Record<string, unknown> {
  const enc = configData._enc
  // 无 _enc 字段或不以 enc:v1: 开头，说明是未加密的旧数据
  if (typeof enc !== 'string' || !enc.startsWith(ENC_PREFIX)) {
    return configData
  }

  const payload = enc.slice(ENC_PREFIX.length)
  const dotIndex = payload.indexOf('.')
  if (dotIndex === -1) {
    throw new Error('加密数据格式错误：缺少分隔符')
  }

  const nonceHex = payload.slice(0, dotIndex)
  const ciphertextHex = payload.slice(dotIndex + 1)
  const nonce = hexToBytes(nonceHex)
  const ciphertext = hexToBytes(ciphertextHex)

  const aes = gcm(key, nonce)
  const plaintext = aes.decrypt(ciphertext) // AES-GCM 自动校验 authTag
  return JSON.parse(bytesToUtf8(plaintext)) as Record<string, unknown>
}

/**
 * 判断 config_data 是否已加密
 */
export function isConfigDataEncrypted(configData: Record<string, unknown>): boolean {
  return typeof configData._enc === 'string' && configData._enc.startsWith(ENC_PREFIX)
}
