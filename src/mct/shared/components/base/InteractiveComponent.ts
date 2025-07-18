import { BaseComponent, type ComponentOptions } from './BaseComponent';
import type { TrackedEventListener } from '$mct/types';

export interface InteractiveComponentOptions extends ComponentOptions {
  autoBindEvents?: boolean;
}

export abstract class InteractiveComponent extends BaseComponent {
  protected eventListeners: TrackedEventListener[] = [];
  protected autoBindEvents: boolean;

  constructor(options: InteractiveComponentOptions) {
    super(options);
    this.autoBindEvents = options.autoBindEvents ?? true;
  }

  /**
   * Override to add event binding logic
   */
  protected onInit(): void {
    this.log('[INTERACTIVE_COMPONENT] onInit()');
    if (this.autoBindEvents) this.bindEvents();
  }

  /**
   * Override to add event cleanup logic
   */
  protected onDestroy(): void {
    this.unbindAllEvents();
  }

  /**
   * Bind all event listeners
   * Override in subclasses to add specific event bindings
   */
  protected abstract bindEvents(): void;

  /**
   * Add an event listener and track it for cleanup
   */
  protected addEventListener(config: TrackedEventListener): void {
    const { element, event, handler, options } = config;
    if (!element) return this.logError('Cannot add event listener: element is null');
    if (!this.eventListeners) return this.logError('Cannot add event listener: eventListeners is null');

    try {
      element.addEventListener(event, handler, options);
      this.eventListeners.push({ element, event, handler, options });

      this.log(`Added event listener: ${event}`, { element, options });
    } catch (error) {
      this.logError('Error adding event listener:', error);
    }
  }

  /**
   * Remove a specific event listener
   */
  protected removeEventListener(config: TrackedEventListener): void {
    const { element, event, handler, options } = config;
    element.removeEventListener(event, handler, options);

    // Remove from tracking array
    const index = this.eventListeners.findIndex((listener) => {
      listener.element === element && listener.event === event && listener.handler === handler;
    });

    if (index === -1) return;
    this.eventListeners.splice(index, 1);
    this.log(`Removed event listener: ${event}`, { element });
  }

  /**
   * Remove all tracked event listeners
   */
  protected unbindAllEvents(): void {
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });

    this.log(`Unbound ${this.eventListeners.length} event listeners`);
    this.eventListeners = [];
  }

  /**
   * Get the number of active event listeners
   */
  public getEventListenerCount(): number {
    return this.eventListeners.length;
  }

  /**
   * Check if an element has a specific event listener
   */
  protected hasEventListener(config: TrackedEventListener): boolean {
    const { element, event, handler } = config;
    return this.eventListeners.some((listener) => {
      listener.element === element && listener.event === event && listener.handler === handler;
    });
  }

  /**
   * Prevent default behavior and stop propagation
   */
  protected preventDefaultAndStop(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Prevent default behavior only
   */
  protected preventDefault(event: Event): void {
    event.preventDefault();
  }

  /**
   * Stop event propagation only
   */
  protected stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Create a debounced event handler
   */
  protected createDebouncedHandler(handler: Function, delay: number = 300): Function {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: any[]) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        handler.apply(this, args);
      }, delay);
    };
  }

  /**
   * Create a throttled event handler
   */
  protected createThrottledHandler(handler: Function, delay: number = 300): Function {
    let lastCall = 0;

    return (...args: any[]) => {
      const now = Date.now();

      if (now - lastCall >= delay) {
        lastCall = now;
        handler.apply(this, args);
      }
    };
  }
}
