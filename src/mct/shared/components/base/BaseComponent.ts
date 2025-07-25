/**
 * BaseComponent - Foundation for all components
 * Handles DOM references, lifecycle methods, and safe element access
 */

import type {
  BaseComponentConfig,
  ComponentError,
  ComponentLifecycle,
  ComponentMetadata,
  ElementOrNull,
  ElementSelector,
  QueryOptions,
} from './types';

export abstract class BaseComponent implements ComponentLifecycle {
  protected readonly id: string;
  protected readonly config: BaseComponentConfig;
  protected metadata: ComponentMetadata;
  protected rootElement: HTMLElement | null = null;
  protected elements: Map<string, HTMLElement> = new Map();

  constructor(config: BaseComponentConfig) {
    this.config = config;
    this.id = config.id || this.generateId();

    this.metadata = {
      name: this.constructor.name,
      initialised: false,
      destroyed: false,
    };

    // Auto-init if requested
    if (config.autoInit) this.init();
  }

  /**
   * Initialize the component
   */
  public async init(): Promise<void> {
    if (this.metadata.initialised) return this.logWarn('Component already initialized');

    try {
      this.metadata.initTime = Date.now();

      this.setRootElement(this.config.component, { required: true });

      // Allow child classes to perform initialization
      await this.onInit();

      this.metadata.initialised = true;
      this.logDebug('Component initialised');
    } catch (error) {
      throw this.createError(`Failed to initialise: ${error}`, 'init');
    }
  }

  /**
   * Destroy the component and clean up resources
   */
  public async destroy(): Promise<void> {
    if (this.metadata.destroyed) return this.logWarn('Component already destroyed');

    try {
      this.metadata.destroyTime = Date.now();

      // Allow child classes to perform cleanup
      await this.onDestroy();

      // Clear element references
      this.elements.clear();
      this.rootElement = null;

      this.metadata.destroyed = true;
      this.metadata.initialised = false;
      this.logDebug('Component destroyed');
    } catch (error) {
      throw this.createError(`Failed to destroy: ${error}`, 'destroy');
    }
  }

  /**
   * Hook for child classes to implement initialisation logic
   */
  protected abstract onInit(): void | Promise<void>;

  /**
   * Hook for child classes to implement cleanup logic
   */
  protected abstract onDestroy(): void | Promise<void>;

  /**
   * Query for a DOM element with enhanced options
   */
  protected query<T extends HTMLElement = HTMLElement>(
    selector: ElementSelector,
    options: QueryOptions = {}
  ): T | null {
    const { required = false, parent = document } = options;

    // Handle direct element passing
    if (selector instanceof HTMLElement) return selector as T;

    if (!selector) {
      if (!required) return null;
      throw this.createError('Selector is required', 'runtime');
    }

    const element = parent.querySelector<T>(selector as string);

    if (!element && required) throw this.createError(`Required element not found: ${selector}`, 'runtime');

    return element;
  }

  /**
   * Query for multiple DOM elements
   */
  protected queryAll<T extends HTMLElement = HTMLElement>(
    selector: string,
    options: Omit<QueryOptions, 'multiple'> = {}
  ): T[] {
    const { parent = document } = options;
    return Array.from(parent.querySelectorAll<T>(selector));
  }

  /**
   * Set the root element for the component
   */
  protected setRootElement(selector: ElementSelector, options?: QueryOptions): void {
    const element = this.query(selector, { ...options, required: true });
    if (element) {
      this.rootElement = element;

      // Add component identifier
      element.dataset['componentId'] = this.id;
    }
  }

  /**
   * Cache an element reference for quick access
   */
  protected cacheElement(key: string, selector: ElementSelector, options?: QueryOptions): void {
    const element = this.query(selector, options);
    if (element) {
      this.elements.set(key, element);
    }
  }

  /**
   * Get a cached element
   */
  protected getElement(key: string): HTMLElement | null {
    return this.elements.get(key) || null;
  }

  /**
   * Check if component is initialized
   */
  public isInitialised(): boolean {
    return this.metadata.initialised && !this.metadata.destroyed;
  }

  /**
   * Check if component is destroyed
   */
  public isDestroyed(): boolean {
    return this.metadata.destroyed;
  }

  /**
   * Get component ID
   */
  public get getId(): string {
    return this.id;
  }

  /**
   * Get component metadata
   */
  public get getMetadata(): Readonly<ComponentMetadata> {
    return { ...this.metadata };
  }

  /**
   * Generate unique component ID
   */
  protected generateId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 11);
    return `${this.metadata.name}-${timestamp}-${randomStr}`;
  }

  /**
   * Create a component-specific error
   */
  protected createError(message: string, phase: 'init' | 'runtime' | 'destroy' = 'runtime'): ComponentError {
    // @ts-expect-error - ComponentError is defined in types
    return new ComponentError(`[${this.id}] ${message}`, this.id, phase);
  }

  /**
   * Safe element text content setter
   */
  protected setText(element: ElementOrNull, text: string): void {
    if (element) element.textContent = text;
  }

  /**
   * Safe attribute setter
   */
  protected setAttribute(element: ElementOrNull, name: string, value: string): void {
    if (element) element.setAttribute(name, value);
  }

  /**
   * Get element attribute value
   */
  protected getAttribute(element: ElementOrNull = this.rootElement, name: string): string | null {
    if (element) return element.getAttribute(name);
    return null;
  }

  /**
   * Toggle CSS class
   */
  protected toggleClass(element: ElementOrNull, className: string, force?: boolean): void {
    if (element) element.classList.toggle(className, force);
  }

  /**
   * Add a style to an element
   */
  protected addStyle(element: ElementOrNull, style: string, value: string): void {
    if (element) element.style.setProperty(style, value);
  }

  /**
   * Remove a style from an element
   */
  protected removeStyle(element: ElementOrNull, style: string): void {
    if (element) element.style.removeProperty(style);
  }

  /**
   * Show an element
   */
  protected async show(element: ElementOrNull = this.rootElement): Promise<void> {
    if (element) this.removeStyle(element, 'display');
    await this.onShow();
  }

  /**
   * Hide an element
   */
  protected async hide(element: ElementOrNull = this.rootElement): Promise<void> {
    if (element) this.addStyle(element, 'display', 'none');
    await this.onHide();
  }

  /**
   * Hook for child classes to implement show logic
   */
  protected abstract onShow(): void | Promise<void>;

  /**
   * Hook for child classes to implement hide logic
   */
  protected abstract onHide(): void | Promise<void>;

  /**
   * Log messages when debug is enabled
   */
  protected logDebug(...args: unknown[]): void {
    if (this.config.debug) console.log(`[${this.constructor.name}]`, ...args);
  }

  /**
   * Log warnings when debug is enabled
   */
  protected logWarn(...args: unknown[]): void {
    if (this.config.debug) console.warn(`[WARN][${this.id}]`, ...args);
  }

  /**
   * Log error messages when debug is enabled
   */
  protected logError(...args: unknown[]): void {
    if (this.config.debug) console.error(`[ERROR][${this.id}]`, ...args);
  }
}
