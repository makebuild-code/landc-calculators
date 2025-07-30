import { EventBus } from '../events/EventBus';
import type { TypedEventHandler } from '../events/EventBus';
import type { EventName, AllEvents } from '$mct/types';
import { debugError, debugLog } from '$utils/debug';

export interface ComponentOptions {
  element: HTMLElement;
  debug?: boolean;
}

export abstract class BaseComponent {
  protected element: HTMLElement;
  protected eventBus: EventBus;
  protected debug: boolean;
  protected isInitialized: boolean = false;
  protected isDestroyed: boolean = false;

  constructor(options: ComponentOptions) {
    this.element = options.element;
    this.eventBus = EventBus.getInstance();
    this.debug = options.debug || false;
  }

  /**
   * Initialize the component - call this after construction
   */
  public initialise(): void {
    if (this.isInitialized || this.isDestroyed) return;
    this.init();
  }

  /**
   * Initialize the component
   * Override in subclasses to add initialization logic
   */
  protected init(): void {
    if (this.isInitialized) return;

    this.isInitialized = true;

    // Call the abstract initialization method
    this.onInit();
  }

  /**
   * Abstract method for component-specific initialization
   * Override in subclasses
   */
  protected abstract onInit(): void;

  /**
   * Abstract method for component-specific cleanup
   * Override in subclasses
   */
  protected abstract onDestroy(): void;

  /**
   * Log messages when debug is enabled
   */
  protected log(message: string, data?: any): void {
    debugLog(`[${this.constructor.name}] ${message}`, data);
  }

  /**
   * Log error messages when debug is enabled
   */
  protected logError(message: string, data?: any): void {
    debugError(`[${this.constructor.name}] ${message}`, data);
  }

  /**
   * Check if component is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && !this.isDestroyed;
  }

  /**
   * Check if component is destroyed
   */
  public getDestroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Destroy the component and clean up resources
   */
  public destroy(): void {
    if (this.isDestroyed) return;

    // Call the abstract cleanup method
    this.onDestroy();

    this.isDestroyed = true;
    this.isInitialized = false;
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
   * Get the component's DOM element
   */
  public getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Get a child element by selector
   */
  protected queryElement<T extends HTMLElement = HTMLElement>(
    selector: string,
    element: HTMLElement = this.element
  ): T | null {
    return element.querySelector(selector) as T;
  }

  /**
   * Get child elements by selector
   */
  protected queryElements<T extends HTMLElement = HTMLElement>(
    selector: string,
    element: HTMLElement = this.element
  ): T[] {
    return Array.from(element.querySelectorAll(selector)) as T[];
  }

  /**
   * Get a child element by attribute selector
   */
  protected queryElementByAttribute<T extends HTMLElement = HTMLElement>(
    attribute: string,
    value?: string,
    element: HTMLElement = this.element
  ): T | null {
    const query = value ? `[${attribute}=${value}]` : `[${attribute}]`;
    return element.querySelector(query) as T;
  }

  /**
   * Get child elements by attributeselector
   */
  protected queryElementsByAttribute<T extends HTMLElement = HTMLElement>(
    attribute: string,
    value?: string,
    element: HTMLElement = this.element
  ): T[] {
    const query = value ? `[${attribute}=${value}]` : `[${attribute}]`;
    return Array.from(element.querySelectorAll(query)) as T[];
  }

  /**
   * Check if element has a specific attribute
   */
  protected hasAttribute(name: string, element: HTMLElement = this.element): boolean {
    return element.hasAttribute(name);
  }

  /**
   * Get element attribute value
   */
  protected getAttribute(name: string, element: HTMLElement = this.element): string | null {
    return element.getAttribute(name);
  }

  /**
   * Set element attribute
   */
  protected setAttribute(element: HTMLElement, name: string, value: string): void {
    element.setAttribute(name, value);
  }

  // /**
  //  * Remove element attribute
  //  */
  // protected removeAttribute(name: string, element: HTMLElement = this.element): void {
  //   element.removeAttribute(name);
  // }

  /**
   * Add CSS class to element
   */
  protected addClass(element: HTMLElement, className: string): void {
    element.classList.add(className);
  }

  /**
   * Remove CSS class from element
   */
  protected removeClass(element: HTMLElement, className: string): void {
    element.classList.remove(className);
  }

  /**
   * Toggle CSS class on element
   */
  protected toggleClass(element: HTMLElement, className: string, force?: boolean): void {
    element.classList.toggle(className, force);
  }

  /**
   * Add a style to an element
   */
  protected addStyle(element: HTMLElement, style: string, value: string): void {
    element.style.setProperty(style, value);
  }

  /**
   * Remove a style from an element
   */
  protected removeStyle(element: HTMLElement, style: string): void {
    element.style.removeProperty(style);
  }

  /**
   * Show an element
   */
  protected show(element: HTMLElement = this.element): void {
    this.removeStyle(element, 'display');
  }

  /**
   * Hide an element
   */
  protected hide(element: HTMLElement = this.element): void {
    this.addStyle(element, 'display', 'none');
  }
}
