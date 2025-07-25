import { BaseComponent } from './BaseComponent';
import { EventBus } from '$mct/components';
import type { AllEvents } from '$mct/types';
import type { ComponentEventEmitter, InteractiveComponentConfig, ListenerConfig } from './types';

export abstract class InteractiveComponent extends BaseComponent implements ComponentEventEmitter {
  protected readonly eventBus: EventBus;
  protected listeners: Map<string, ListenerConfig> = new Map();
  protected unsubscribers: Array<() => void> = [];
  protected delegatedHandlers: Map<string, EventListener> = new Map();

  constructor(options: InteractiveComponentConfig) {
    super(options);
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Initialize component and set up event listeners
   */
  protected async onInit(): Promise<void> {
    await this.setupEventListeners();

    // Initialize custom events if provided in config
    if ((this.config as InteractiveComponentConfig).events) {
      this.bindConfigEvents();
    }
  }

  /**
   * Clean up all event listeners and subscriptions
   */
  protected async onDestroy(): Promise<void> {
    this.removeListeners();
    this.removeAllSubscriptions();
    this.removeDelegatedHandlers();
  }

  /**
   * Hook for child classes to set up event listeners
   */
  protected abstract setupEventListeners(): void | Promise<void>;

  /**
   * Add an event listener with automatic cleanup
   */
  protected on(
    target: HTMLElement | Window | Document | string,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    let element: HTMLElement | Window | Document;
    let key: string;

    // Handle selector-based listeners (cached elements)
    if (typeof target === 'string') {
      const cached = this.getElement(target);
      if (!cached) {
        this.logWarn(`Cached element not found: ${target}`);
        return;
      }
      element = cached;
      key = `${target}-${event}`;
    } else {
      element = target;
      key = `${element.constructor.name}-${event}-${Date.now()}`;
    }

    // Remove existing listener if present
    if (this.listeners.has(key)) {
      this.removeListener(key);
    }

    // Add the listener
    element.addEventListener(event, handler, options);

    // Store for cleanup
    this.listeners.set(key, {
      element,
      event,
      handler,
      options: options || undefined,
    });

    this.logDebug(`Added listener: ${key}`);
  }

  /**
   * Remove a specific event listener
   */
  protected removeListener(key: string): void {
    const config = this.listeners.get(key);
    if (config) {
      config.element.removeEventListener(config.event, config.handler, config.options);
      this.listeners.delete(key);
      this.logDebug(`Removed listener: ${key}`);
    }
  }

  /**
   * Remove all event listeners
   */
  protected removeListeners(): void {
    this.listeners.forEach((_, key) => {
      this.removeListener(key);
    });
  }

  /**
   * Set up event delegation for dynamic content
   */
  protected delegate(
    event: string,
    selector: string,
    handler: (event: Event, target: HTMLElement) => void,
    parent: HTMLElement | Document = document
  ): void {
    const delegatedHandler: EventListener = (e) => {
      const target = e.target as HTMLElement;
      const delegateTarget = target.closest(selector);

      if (delegateTarget && parent.contains(delegateTarget)) {
        handler.call(this, e, delegateTarget as HTMLElement);
      }
    };

    const key = `${event}-${selector}`;

    // Remove existing handler
    if (this.delegatedHandlers.has(key)) {
      parent.removeEventListener(event, this.delegatedHandlers.get(key)!);
    }

    // Add new handler
    parent.addEventListener(event, delegatedHandler, true);
    this.delegatedHandlers.set(key, delegatedHandler);
  }

  /**
   * Remove delegated event handlers
   */
  protected removeDelegatedHandlers(): void {
    this.delegatedHandlers.forEach((handler, key) => {
      const [event] = key.split('-');
      if (event) {
        document.removeEventListener(event, handler, true);
      }
    });
    this.delegatedHandlers.clear();
  }

  /**
   * Subscribe to EventBus events
   */
  protected subscribe<K extends keyof AllEvents>(event: K, handler: (payload: AllEvents[K]) => void): void {
    const unsubscribe = this.eventBus.on(event, handler);
    this.unsubscribers.push(unsubscribe);
  }

  /**
   * Remove all EventBus subscriptions
   */
  protected removeAllSubscriptions(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
  }

  /**
   * Emit an event through the EventBus
   */
  public emit<K extends keyof AllEvents>(event: K, payload: AllEvents[K]): void {
    this.eventBus.emit(event, payload);
  }

  /**
   * Emit a custom DOM event
   */
  public emitCustom(eventName: string, detail: unknown, target?: HTMLElement): void {
    const element = target || this.rootElement || document.body;
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
  }

  /**
   * Bind events from configuration
   */
  private bindConfigEvents(): void {
    const config = this.config as InteractiveComponentConfig;
    if (!config.events || !this.rootElement) return;

    Object.entries(config.events).forEach(([eventName, handler]) => {
      this.on(this.rootElement!, eventName, handler.bind(this));
    });
  }

  /**
   * Get all active listeners (for debugging)
   */
  protected getActiveListeners(): ReadonlyMap<string, ListenerConfig> {
    return new Map(this.listeners);
  }

  /**
   * Get listener count
   */
  protected getListenerCount(): number {
    return this.listeners.size + this.unsubscribers.length;
  }
}
