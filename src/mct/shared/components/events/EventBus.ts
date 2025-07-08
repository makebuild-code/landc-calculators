export interface EventPayload {
  [key: string]: any;
}

export interface EventHandler<T = EventPayload> {
  (payload: T): void;
}

export type AnyEventHandler = EventHandler<any>;

export class EventBus {
  private handlers: Map<string, Set<AnyEventHandler>> = new Map();
  private debug: boolean = false;
  private globalHandlers: Set<AnyEventHandler> = new Set();

  constructor(options: { debug?: boolean } = {}) {
    this.debug = options.debug || false;
  }

  /**
   * Subscribe to a specific event
   * @returns Unsubscribe function
   */
  on<T = EventPayload>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(handler as AnyEventHandler);

    if (this.debug) {
      console.log(`📡 EventBus: Subscribed to "${event}"`);
    }

    return () => {
      this.handlers.get(event)?.delete(handler as AnyEventHandler);
      if (this.debug) {
        console.log(`📡 EventBus: Unsubscribed from "${event}"`);
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
   * Emit an event to all subscribers
   */
  emit<T = EventPayload>(event: string, payload?: T): void {
    if (this.debug) {
      console.log(`📡 EventBus: Emitting "${event}"`, payload);
    }

    // Notify global handlers first
    this.globalHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in global event handler for ${event}:`, error);
      }
    });

    // Notify specific event handlers
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Check if there are any handlers for an event
   */
  hasHandlers(event: string): boolean {
    return this.handlers.has(event) && this.handlers.get(event)!.size > 0;
  }

  /**
   * Get the number of handlers for an event
   */
  getHandlerCount(event: string): number {
    return this.handlers.get(event)?.size || 0;
  }

  /**
   * Clear all handlers for a specific event
   */
  clearEvent(event: string): void {
    this.handlers.delete(event);
    if (this.debug) {
      console.log(`📡 EventBus: Cleared all handlers for "${event}"`);
    }
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
    if (this.debug) {
      console.log(`📡 EventBus: Cleared all handlers`);
    }
  }
}
