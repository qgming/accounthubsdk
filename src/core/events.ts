/**
 * 事件类型定义
 */
export type EventType =
  | 'auth:signin'
  | 'auth:signup'
  | 'auth:signout'
  | 'auth:statechange'
  | 'membership:created'
  | 'membership:updated'
  | 'membership:cancelled'
  | 'payment:created'
  | 'payment:completed'
  | 'payment:failed'
  | 'update:available'
  | 'update:downloaded';

/**
 * 事件负载类型
 */
export type EventPayload = {
  'auth:signin': { userId: string };
  'auth:signup': { userId: string };
  'auth:signout': Record<string, never>;
  'auth:statechange': { user: any | null };
  'membership:created': { membership: any };
  'membership:updated': { membership: any };
  'membership:cancelled': { membership: any };
  'payment:created': { paymentId: string };
  'payment:completed': { paymentId: string };
  'payment:failed': { paymentId: string; error: string };
  'update:available': { version: string };
  'update:downloaded': { version: string };
};

/**
 * 事件监听器类型
 */
type EventListener<T extends EventType> = (payload: EventPayload[T]) => void;

/**
 * 事件发射器类
 */
export class EventEmitter {
  private listeners: Map<EventType, Set<EventListener<any>>> = new Map();

  /**
   * 监听事件
   * @param event 事件类型
   * @param listener 监听器函数
   * @returns 取消监听的函数
   */
  on<T extends EventType>(event: T, listener: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // 返回取消监听的函数
    return () => this.off(event, listener);
  }

  /**
   * 取消监听事件
   * @param event 事件类型
   * @param listener 监听器函数
   */
  off<T extends EventType>(event: T, listener: EventListener<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param payload 事件负载
   */
  emit<T extends EventType>(event: T, payload: EventPayload[T]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`事件监听器 ${event} 发生错误:`, error);
        }
      });
    }
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.listeners.clear();
  }
}
