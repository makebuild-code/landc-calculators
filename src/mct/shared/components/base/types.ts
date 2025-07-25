import type { AllEvents } from '$mct/types';

// Component lifecycle methods
export interface ComponentLifecycle {
  init(): void | Promise<void>;
  destroy(): void | Promise<void>;
}

// Component metadata
export interface ComponentMetadata {
  name: string;
  version?: string;
  initialised: boolean;
  destroyed: boolean;
  initTime?: number;
  destroyTime?: number;
}

// DOM query options
export interface QueryOptions {
  required?: boolean; // Throw if element not found
  parent?: HTMLElement | Document; // Parent to search within
  multiple?: boolean; // Return all matches
}

export interface BaseComponentConfig {
  id: string;
  component: HTMLElement;
  debug?: boolean;
  autoInit?: boolean;
}

// Event listener configuration
export interface ListenerConfig {
  element: HTMLElement | Window | Document;
  event: string;
  handler: EventListener;
  options?: AddEventListenerOptions | undefined;
}

// Interactive component configuration
export interface InteractiveComponentConfig extends BaseComponentConfig {
  events?: { [key: string]: EventListener };
  delegateTarget?: string; // For event delegation
}

// State types
export type StateValue = string | number | boolean | object | null;

export interface ComponentStateConfig {
  key: string;
  defaultValue?: StateValue;
  storage?: 'memory' | 'local' | 'session';
  validate?: (value: StateValue) => boolean;
  transform?: (value: StateValue) => StateValue;
}

// Stateful component configuration
export interface StatefulComponentConfig extends InteractiveComponentConfig {
  state?: ComponentStateConfig | ComponentStateConfig[];
  persistState?: boolean;
  statePrefix?: string; // Prefix for storage keys
}

// Component state
export interface ComponentState {
  [key: string]: StateValue;
}

// State change event
export interface StateChangeEvent {
  key: string;
  component: string; // Component ID
  previous: StateValue;
  current: StateValue;
}

// Component error types
export class ComponentError extends Error {
  constructor(
    message: string,
    public componentId: string,
    public phase: 'init' | 'runtime' | 'destroy'
  ) {
    super(message);
    this.name = 'ComponentError';
  }
}

// DOM utility types
export type ElementSelector = string | HTMLElement | null;
export type ElementOrNull = HTMLElement | null;
export type ElementArray = HTMLElement[];

// Event emitter interface for components
export interface ComponentEventEmitter {
  emit<K extends keyof AllEvents>(event: K, payload: AllEvents[K]): void;
  emitCustom(event: string, detail: unknown): void;
}

// Storage adapter interface
export interface StorageAdapter {
  get(key: string): StateValue;
  set(key: string, value: StateValue): void;
  remove(key: string): void;
  clear(): void;
}
