import type { CacheMetadata, BackoffConfig } from './cache-manager'
import { withTimeout, isTimeoutError } from './timeout-controller'

/**
 * 更新调度器
 * 管理后台更新任务，实现节流和退避策略
 */
export class UpdateScheduler {
  private runningTasks: Map<string, Promise<void>> = new Map()
  private defaultBackoffConfig: BackoffConfig = {
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    multiplier: 2,
    maxRetries: 5,
  }

  /**
   * 检查是否应该触发后台更新
   * @param metadata 缓存元数据
   * @param throttleMs 节流时间（默认 24h）
   * @param backoffConfig 退避配置
   */
  shouldTriggerBackgroundUpdate(
    metadata: CacheMetadata | null,
    throttleMs: number,
    backoffConfig?: BackoffConfig
  ): boolean {
    // 无缓存，应该更新
    if (!metadata) {
      return true
    }

    const now = Date.now()
    const config = backoffConfig || this.defaultBackoffConfig

    // 检查是否超过最大重试次数
    if (metadata.updateAttempts >= config.maxRetries) {
      return false
    }

    // 检查节流时间
    const timeSinceLastSuccess = now - metadata.lastSuccessfulUpdate
    if (timeSinceLastSuccess < throttleMs) {
      return false
    }

    // 检查退避延迟
    if (metadata.updateAttempts > 0) {
      const backoffDelay = Math.min(
        config.initialDelayMs * Math.pow(config.multiplier, metadata.updateAttempts),
        config.maxDelayMs
      )
      const timeSinceLastAttempt = now - metadata.lastUpdateAttempt
      if (timeSinceLastAttempt < backoffDelay) {
        return false
      }
    }

    return true
  }

  /**
   * 调度后台更新（非阻塞）
   * @param configKey 配置键
   * @param updateFn 更新函数
   * @param timeoutMs 超时时间
   */
  scheduleBackgroundUpdate(
    configKey: string,
    updateFn: () => Promise<void>,
    timeoutMs: number = 1200
  ): void {
    // 防止重复更新
    if (this.runningTasks.has(configKey)) {
      return
    }

    // 创建更新任务
    const task = this.executeBackgroundUpdate(configKey, updateFn, timeoutMs)
    this.runningTasks.set(configKey, task)

    // 任务完成后清理
    task.finally(() => {
      this.runningTasks.delete(configKey)
    })
  }

  /**
   * 执行后台更新（带超时和错误处理）
   */
  private async executeBackgroundUpdate(
    configKey: string,
    updateFn: () => Promise<void>,
    timeoutMs: number
  ): Promise<void> {
    try {
      await withTimeout(
        updateFn(),
        timeoutMs,
        `后台更新超时: ${configKey} (${timeoutMs}ms)`
      )
      console.log(`[UpdateScheduler] 后台更新成功: ${configKey}`)
    } catch (error) {
      if (isTimeoutError(error)) {
        console.warn(`[UpdateScheduler] 后台更新超时: ${configKey}`)
      } else {
        console.warn(`[UpdateScheduler] 后台更新失败: ${configKey}`, error)
      }
      // 静默失败，不影响主流程
    }
  }

  /**
   * 批量调度后台更新
   */
  scheduleBatchUpdate(
    configKeys: string[],
    updateFnFactory: (configKey: string) => () => Promise<void>,
    timeoutMs: number = 1200
  ): void {
    for (const configKey of configKeys) {
      this.scheduleBackgroundUpdate(configKey, updateFnFactory(configKey), timeoutMs)
    }
  }

  /**
   * 等待所有正在运行的任务完成
   */
  async waitAll(): Promise<void> {
    await Promise.allSettled(Array.from(this.runningTasks.values()))
  }

  /**
   * 获取正在运行的任务数量
   */
  getRunningTaskCount(): number {
    return this.runningTasks.size
  }

  /**
   * 检查指定配置是否正在更新
   */
  isUpdating(configKey: string): boolean {
    return this.runningTasks.has(configKey)
  }
}
