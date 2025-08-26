import { BaseComponent, type BaseComponentConfig } from './BaseComponent';
import { EventBus } from '../events/EventBus';
import type { TypedEventHandler } from '../events/EventBus';
import type { EventName, AllEvents, TrackedEventListener } from '$mct/types';

export interface InteractiveComponentConfig extends BaseComponentConfig {
  autoBindEvents?: boolean;
  eventNamespace?: string; // For debugging event sources
}

export abstract class InteractiveComponent extends BaseComponent {
  protected eventBus: EventBus;
  protected eventListeners: TrackedEventListener[] = [];
  protected autoBindEvents: boolean;

  constructor(options: InteractiveComponentConfig) {
    super(options);
    this.eventBus = EventBus.getInstance();
    this.autoBindEvents = options.autoBindEvents ?? true;
  }

  /**
   * Override to add event binding logic
   */
  protected onInit(): void {
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
  }

  /**
   * Remove all tracked event listeners
   */
  protected unbindAllEvents(): void {
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });

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

  /**
   * Emit an event through the event bus
   */
  protected emit<T extends EventName>(event: T, payload: AllEvents[T]): void {
    if (this.isDestroyed) return;
    this.eventBus.emit(event, payload);
  }

  /**
   * Subscribe to an event
   * @returns Unsubscribe function
   */
  protected on<T extends EventName>(event: T, handler: TypedEventHandler<T>): () => void {
    return this.eventBus.on(event, handler);
  }

  /**
   * Subscribe to an event once
   * @returns Unsubscribe function
   */
  protected once<T extends EventName>(event: T, handler: TypedEventHandler<T>): () => void {
    const unsubscribe = this.eventBus.on(event, (payload) => {
      handler(payload);
      unsubscribe();
    });
    return unsubscribe;
  }

  /**
   * Check if Enter key was pressed
   */
  protected isEnterKey(event: KeyboardEvent): boolean {
    return event.key === 'Enter' || event.keyCode === 13;
  }

  /**
   * Check if Escape key was pressed
   */
  protected isEscapeKey(event: KeyboardEvent): boolean {
    return event.key === 'Escape' || event.keyCode === 27;
  }

  /**
   * Check if Space key was pressed
   */
  protected isSpaceKey(event: KeyboardEvent): boolean {
    return event.key === ' ' || event.keyCode === 32;
  }

  /**
   * Check if Arrow key was pressed
   */
  protected isArrowKey(event: KeyboardEvent): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
  }

  /**
   * Focus first element matching selector
   */
  protected focusFirst(selector: string, container: HTMLElement = this.element): void {
    const element = this.queryElement<HTMLElement>(selector, container);
    element?.focus();
  }

  /**
   * Trap focus within a container
   * @returns Cleanup function to remove focus trap
   */
  protected trapFocus(container: HTMLElement = this.element): () => void {
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(container.querySelectorAll(focusableElements)) as HTMLElement[];
    
    const firstFocusable = focusables[0];
    const lastFocusable = focusables[focusables.length - 1];
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    return () => container.removeEventListener('keydown', handleTabKey);
  }
}
