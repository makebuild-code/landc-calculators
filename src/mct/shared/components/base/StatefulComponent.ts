import { debugError } from '$utils/debug';
import { InteractiveComponent, type InteractiveComponentOptions } from './InteractiveComponent';

export interface StatefulComponentOptions<T = any> extends InteractiveComponentOptions {
  initialState: T;
}

export abstract class StatefulComponent<T = any> extends InteractiveComponent {
  protected state: T;
  protected previousState: T;
  protected stateSubscribers: Set<(currentState: T, previousState: T) => void>;

  constructor(options: StatefulComponentOptions<T>) {
    super(options);
    this.stateSubscribers = new Set();
    this.state = options.initialState;
    this.previousState = options.initialState;
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

    this.previousState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // // Only log if state actually changed
    // if (this.debug && !this.shallowEqual(this.previousState, this.state))
    //   this.log('State updated', { previous: this.previousState, current: this.state, changes: updates });

    // Notify subscribers
    this.notifyStateSubscribers();

    // // Emit state change event
    // this.emit('state:changed', {
    //   changes: updates,
    //   previousState: this.previousState,
    //   currentState: this.state,
    // });

    // Call the state change handler
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
}
