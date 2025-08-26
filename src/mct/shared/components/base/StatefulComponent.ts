import { debugError } from '$utils/debug';
import { InteractiveComponent, type InteractiveComponentConfig } from './InteractiveComponent';

export interface StatefulComponentConfig extends InteractiveComponentConfig {
  persistState?: boolean;
  persistKey?: string;
}

export abstract class StatefulComponent<T = any> extends InteractiveComponent {
  protected state: T;
  protected previousState: T;
  protected stateSubscribers: Set<(currentState: T, previousState: T) => void>;
  private persistConfig: StatefulComponentConfig | null = null;
  private pendingUpdates: Partial<T>[] = [];
  private updateScheduled = false;

  constructor(config: StatefulComponentConfig, initialState: T) {
    super(config);
    this.stateSubscribers = new Set();

    // Load from localStorage if persistence enabled
    if (config.persistState && config.persistKey) {
      const saved = localStorage.getItem(config.persistKey);
      this.state = saved ? JSON.parse(saved) : initialState;
    } else {
      this.state = initialState;
    }

    this.previousState = { ...this.state };
    this.persistConfig = config.persistState ? config : null;
  }

  /**
   * Get the current state
   */
  public getState(): T {
    return { ...this.state };
  }

  /**
   * Get the previous state
   */
  public getPreviousState(): T {
    return { ...this.previousState };
  }

  /**
   * Shallow compare two state objects
   */
  private shallowEqual(objA: any, objB: any): boolean {
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (objA[key] !== objB[key]) return false;
    }
    return true;
  }

  /**
   * Set state with updates
   * Triggers state change events and notifies subscribers
   */
  protected setState(updates: Partial<T>): void {
    if (this.isDestroyed) return;

    // Ensure state is initialized
    if (!this.state) {
      this.logError('Cannot setState before state is initialized');
      return;
    }

    const newState = { ...this.state, ...updates };

    if (!this.validateState(newState)) {
      this.logError('Invalid state update blocked', { updates, currentState: this.state });
      return;
    }

    this.previousState = { ...this.state };
    this.state = newState;

    // Persist if enabled
    if (this.persistConfig?.persistState && this.persistConfig.persistKey) {
      localStorage.setItem(this.persistConfig.persistKey, JSON.stringify(this.state));
    }

    // Notify subscribers and call lifecycle
    this.notifyStateSubscribers();
    this.onStateChange(this.previousState, this.state);
  }

  /**
   * Subscribe to state changes
   * @returns Unsubscribe function
   */
  public subscribeToState(callback: (currentState: T, previousState: T) => void): () => void {
    this.stateSubscribers.add(callback);

    return () => this.stateSubscribers.delete(callback);
  }

  /**
   * Notify all state subscribers
   */
  private notifyStateSubscribers(): void {
    if (!this.stateSubscribers) return;

    this.stateSubscribers.forEach((callback) => {
      try {
        callback(this.state, this.previousState);
      } catch (error) {
        debugError('Error in state subscriber:', error);
      }
    });
  }

  /**
   * Override in subclasses to handle state changes
   */
  protected onStateChange(previousState: T, currentState: T): void {
    // Override in subclasses
  }

  /**
   * Check if a specific part of the state has changed
   */
  protected hasStateChanged<K extends keyof T>(key: K): boolean {
    return this.state[key] !== this.previousState[key];
  }

  /**
   * Get the value of a specific state key
   */
  public getStateValue<K extends keyof T>(key: K): T[K] {
    return this.state[key];
  }

  /**
   * Set the value of a specific state key
   */
  protected setStateValue<K extends keyof T>(key: K, value: T[K]): void {
    this.setState({ [key]: value } as unknown as Partial<T>);
  }

  /**
   * Reset state to initial values
   */
  protected resetState(): void {
    this.setState(this.getInitialState());
  }

  /**
   * Get the initial state (override in subclasses if needed)
   */
  protected getInitialState(): T {
    return this.state;
  }

  /**
   * Override to add cleanup for state subscribers
   */
  protected onDestroy(): void {
    super.onDestroy();
    this.stateSubscribers.clear();
  }

  /**
   * Validate state before applying updates
   * Override in subclasses to add validation logic
   */
  protected validateState(state: T): boolean {
    // Override in subclasses
    return true;
  }

  /**
   * Batch multiple state updates
   */
  protected batchUpdate(updates: Partial<T>): void {
    this.pendingUpdates.push(updates);

    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => {
        const merged = this.pendingUpdates.reduce((acc, update) => ({ ...acc, ...update }), {});
        this.setState(merged);
        this.pendingUpdates = [];
        this.updateScheduled = false;
      });
    }
  }

  /**
   * Create a computed property based on state
   */
  protected createComputed<K>(computeFn: (state: T) => K): () => K {
    let cachedValue: K;
    let cachedState: T | null = null;

    return () => {
      if (cachedState !== this.state) {
        cachedValue = computeFn(this.state);
        cachedState = this.state;
      }
      return cachedValue;
    };
  }
}
