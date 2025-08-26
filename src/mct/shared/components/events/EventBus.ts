import type { AllEvents, EventName } from '$mct/types';
import { debugError, debugLog } from '$utils/debug';

export interface TypedEventHandler<T extends EventName> {
  (payload: AllEvents[T]): void;
}

export type AnyEventHandler = TypedEventHandler<any>;

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<EventName, Set<TypedEventHandler<any>>> = new Map();
  private debug: boolean = false;
  private globalHandlers: Set<TypedEventHandler<any>> = new Set();

  constructor(options: { debug?: boolean } = {}) {
    // this.debug = options.debug || false;
    this.debug = false;
  }

  /**
   * Get the instance of the EventBus
   * @returns The instance of the EventBus
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) EventBus.instance = new EventBus();
    return EventBus.instance;
  }

  /**
   * Subscribe to a specific event with full type safety
   * @returns Unsubscribe function
   */
  on<T extends EventName>(event: T, handler: TypedEventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(handler);

    if (this.debug) {
      debugLog(`📡 EventBus: Subscribed to "${event}"`);
    }

    return () => {
      this.handlers.get(event)?.delete(handler);
      if (this.debug) {
        debugLog(`📡 EventBus: Unsubscribed from "${event}"`);
      }
    };
  }

  /**
   * Subscribe to all events (useful for debugging/monitoring)
   */
  onAll(handler: AnyEventHandler): () => void {
    this.globalHandlers.add(handler);

    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  /**
   * Emit an event to all subscribers with full type safety
   */
  emit<T extends EventName>(event: T, payload: AllEvents[T]): void {
    if (this.debug) {
      debugLog(`📡 EventBus: Emitting "${event}"`, payload);
    }

    // Notify global handlers first
    this.globalHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        debugError(`Error in global event handler for ${event}:`, error);
      }
    });

    // Notify specific event handlers
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          debugError(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Check if there are any handlers for an event
   */
  hasHandlers(event: EventName): boolean {
    return this.handlers.has(event) && this.handlers.get(event)!.size > 0;
  }

  /**
   * Get the number of handlers for an event
   */
  getHandlerCount(event: EventName): number {
    return this.handlers.get(event)?.size || 0;
  }

  /**
   * Clear all handlers for a specific event
   */
  clearEvent(event: EventName): void {
    this.handlers.delete(event);
    if (this.debug) {
      debugLog(`📡 EventBus: Cleared all handlers for "${event}"`);
    }
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
    if (this.debug) {
      debugLog(`📡 EventBus: Cleared all handlers`);
    }
  }
}
