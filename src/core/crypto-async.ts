import { deriveKey, decryptConfigData } from './crypto'

/**
 * Web Worker 响应类型
 */
interface WorkerResponse {
  id: number
  result?: Uint8Array | Record<string, unknown>
  error?: string
}

/**
 * 异步加密工具类
 * 浏览器环境使用 Web Worker，React Native 使用 setTimeout 分片
 */
export class AsyncCrypto {
  private worker: Worker | null = null
  private workerSupported: boolean = false
  private derivedKeyCache: Map<string, Uint8Array> = new Map()
  private pendingRequests: Map<number, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map()
  private requestId: number = 0

  constructor(useWorker: boolean = true) {
    if (useWorker && this.isWorkerSupported()) {
      this.initWorker()
    }
  }

  /**
   * 检测是否支持 Web Worker
   */
  private isWorkerSupported(): boolean {
    try {
      return typeof Worker !== 'undefined' && typeof window !== 'undefined'
    } catch {
      return false
    }
  }

  /**
   * 初始化 Web Worker
   */
  private initWorker(): void {
    try {
      // 创建 Worker（需要在构建时处理）
      const workerCode = `
        importScripts('https://cdn.jsdelivr.net/npm/@noble/hashes@1.3.3/pbkdf2.js');
        importScripts('https://cdn.jsdelivr.net/npm/@noble/hashes@1.3.3/sha256.js');
        importScripts('https://cdn.jsdelivr.net/npm/@noble/ciphers@0.4.1/aes.js');

        self.onmessage = function(e) {
          const { type, id, appKey, appId, configData, key } = e.data;

          try {
            if (type === 'deriveKey') {
              // PBKDF2 密钥派生
              const keyMaterial = new TextEncoder().encode(appKey);
              const salt = new TextEncoder().encode(appId);
              const derivedKey = pbkdf2(sha256, keyMaterial, salt, { c: 100000, dkLen: 32 });
              self.postMessage({ id, result: derivedKey });
            } else if (type === 'decrypt') {
              // AES-GCM 解密
              const enc = configData._enc;
              if (typeof enc !== 'string' || !enc.startsWith('enc:v1:')) {
                self.postMessage({ id, result: configData });
                return;
              }

              const payload = enc.slice(7);
              const dotIndex = payload.indexOf('.');
              const nonceHex = payload.slice(0, dotIndex);
              const ciphertextHex = payload.slice(dotIndex + 1);

              const nonce = hexToBytes(nonceHex);
              const ciphertext = hexToBytes(ciphertextHex);

              const aes = gcm(key, nonce);
              const plaintext = aes.decrypt(ciphertext);
              const decrypted = JSON.parse(new TextDecoder().decode(plaintext));

              self.postMessage({ id, result: decrypted });
            }
          } catch (error) {
            self.postMessage({ id, error: error.message });
          }
        };

        function hexToBytes(hex) {
          const bytes = new Uint8Array(hex.length / 2);
          for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
          }
          return bytes;
        }
      `

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      this.worker = new Worker(URL.createObjectURL(blob))
      this.workerSupported = true

      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, result, error } = e.data
        const pending = this.pendingRequests.get(id)

        if (pending) {
          if (error) {
            pending.reject(new Error(error))
          } else {
            pending.resolve(result)
          }
          this.pendingRequests.delete(id)
        }
      }

      this.worker.onerror = (error: ErrorEvent) => {
        console.error('[AsyncCrypto] Worker 错误:', error)
        this.workerSupported = false
      }
    } catch (error) {
      console.warn('[AsyncCrypto] Worker 初始化失败，降级到同步模式:', error)
      this.workerSupported = false
    }
  }

  /**
   * 异步派生密钥
   */
  async deriveKey(appKey: string, appId: string): Promise<Uint8Array> {
    const cacheKey = `${appKey}:${appId}`

    // 检查缓存
    const cached = this.derivedKeyCache.get(cacheKey)
    if (cached) {
      return cached
    }

    let key: Uint8Array

    if (this.workerSupported && this.worker) {
      // 使用 Worker
      key = await this.sendWorkerMessage('deriveKey', { appKey, appId })
    } else {
      // 降级：使用 setTimeout 分片执行
      key = await this.deriveKeyWithTimeout(appKey, appId)
    }

    // 缓存密钥
    this.derivedKeyCache.set(cacheKey, key)
    return key
  }

  /**
   * 使用 setTimeout 分片执行密钥派生（降级方案）
   */
  private async deriveKeyWithTimeout(appKey: string, appId: string): Promise<Uint8Array> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const key = deriveKey(appKey, appId)
        resolve(key)
      }, 0)
    })
  }

  /**
   * 异步解密配置数据
   */
  async decryptConfigData(
    configData: Record<string, unknown>,
    key: Uint8Array
  ): Promise<Record<string, unknown>> {
    // 检查是否需要解密
    const enc = configData._enc
    if (typeof enc !== 'string' || !enc.startsWith('enc:v1:')) {
      return configData
    }

    if (this.workerSupported && this.worker) {
      // 使用 Worker
      return await this.sendWorkerMessage('decrypt', { configData, key })
    } else {
      // 降级：使用 setTimeout 分片执行
      return await this.decryptWithTimeout(configData, key)
    }
  }

  /**
   * 使用 setTimeout 分片执行解密（降级方案）
   */
  private async decryptWithTimeout(
    configData: Record<string, unknown>,
    key: Uint8Array
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const decrypted = decryptConfigData(configData, key)
        resolve(decrypted)
      }, 0)
    })
  }

  /**
   * 发送 Worker 消息
   */
  private sendWorkerMessage(type: 'deriveKey' | 'decrypt', data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.requestId++
      this.pendingRequests.set(id, { resolve, reject })

      this.worker!.postMessage({
        type,
        id,
        ...data,
      })

      // 超时保护
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('Worker 请求超时'))
        }
      }, 10000)
    })
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.derivedKeyCache.clear()
    this.pendingRequests.clear()
  }
}
