/**
 * StatefulComponent - Extends InteractiveComponent with state management
 * Provides local and persistent state capabilities with change tracking
 */

import { PersistenceManager, StateManager, StorageManager, type StateChangeEvent } from '$mct/state';
import { StateEventNames, type AppState, type PersistenceConfig, type StorageType } from '$mct/types';
import { InteractiveComponent } from './InteractiveComponent';
import type { ComponentState, ComponentStateConfig, StatefulComponentConfig, StateValue } from './types';

export abstract class StatefulComponent<TState extends ComponentState = ComponentState> extends InteractiveComponent {
  protected state: TState;
  protected stateConfigs: Map<keyof TState, ComponentStateConfig> = new Map();
  protected stateManager: StateManager;
  protected storageManager: StorageManager;
  protected persistenceManager: PersistenceManager;
  protected statePrefix: string;
  protected initialState: Partial<TState> = {};
  protected previousState: Partial<TState> = {};

  constructor(config: StatefulComponentConfig) {
    super(config);

    this.state = {} as TState;
    this.stateManager = StateManager.getInstance();
    this.storageManager = StorageManager.getInstance();
    this.persistenceManager = PersistenceManager.getInstance();
    this.statePrefix = config.statePrefix || this.id;

    // Configure state from config
    if (config.state) {
      const configs = Array.isArray(config.state) ? config.state : [config.state];
      configs.forEach((stateConfig) => this.configureState(stateConfig));
    }
  }

  /**
   * Initialize component and restore state
   */
  protected override async onInit(): Promise<void> {
    await super.onInit();

    // Restore state from storage
    this.restoreState();

    // Subscribe to global state changes if using StateManager
    this.subscribeToStateChanges();
  }

  /**
   * Save state before destroying
   */
  protected override async onDestroy(): Promise<void> {
    // Persist state if configured
    if ((this.config as StatefulComponentConfig).persistState) {
      this.persistState();
    }

    await super.onDestroy();
  }

  /**
   * Configure a state property
   */
  protected configureState(config: ComponentStateConfig): void {
    const key = config.key as keyof TState;
    this.stateConfigs.set(key, config);

    // Set default value
    if (config.defaultValue !== undefined) {
      this.state[key] = config.defaultValue as TState[keyof TState];
      this.initialState[key] = config.defaultValue as TState[keyof TState];
    }
  }

  /**
   * Get state value
   */
  protected getState<K extends keyof TState>(key: K): TState[K] {
    return this.state[key];
  }

  /**
   * Set state value with validation and change tracking
   */
  protected setState<K extends keyof TState>(
    key: K,
    value: TState[K],
    options: { silent?: boolean; persist?: boolean } = {}
  ): boolean {
    const previous = this.state[key];

    // Skip if value hasn't changed
    if (this.isEqual(previous, value)) return false;

    const config = this.stateConfigs.get(key);

    // Validate if validator provided
    if (config?.validate && !config.validate(value as StateValue)) {
      this.logWarn(`State validation failed for ${String(key)}:`, value);
      return false;
    }

    // Transform if transformer provided
    const transformedValue = config?.transform ? (config.transform(value as StateValue) as TState[K]) : value;

    // Update state
    this.state[key] = transformedValue;

    // Persist if configured
    if (options.persist !== false) {
      this.persistStateKey(key, transformedValue);
    }

    // Emit change event
    if (!options.silent) {
      this.onStateChange(key, previous, transformedValue);
    }

    return true;
  }

  /**
   * Batch update multiple state values
   */
  protected setStates(updates: Partial<TState>, options: { silent?: boolean; persist?: boolean } = {}): void {
    const changes: Array<{ key: keyof TState; previous: unknown; current: unknown }> = [];

    Object.entries(updates).forEach(([key, value]) => {
      const typedKey = key as keyof TState;
      const oldValue = this.state[typedKey];

      if (this.setState(typedKey, value as TState[keyof TState], { ...options, silent: true })) {
        changes.push({ key: typedKey, previous: oldValue, current: value });
      }
    });

    // Emit batch change event
    if (!options.silent && changes.length > 0) {
      changes.forEach(({ key, previous: oldValue, current: newValue }) => {
        this.onStateChange(key, oldValue, newValue);
      });
    }
  }

  /**
   * Reset state to initial values
   */
  protected resetState(keys?: Array<keyof TState>): void {
    const keysToReset = keys || (Object.keys(this.state) as Array<keyof TState>);

    keysToReset.forEach((key) => {
      if (key in this.initialState) {
        this.setState(key, this.initialState[key] as TState[keyof TState]);
      }
    });
  }

  /**
   * Get all current state
   */
  protected getAllState(): Readonly<TState> {
    return { ...this.state };
  }

  /**
   * Subscribe to global state changes
   */
  protected subscribeToStateChanges(): void {
    // Subscribe to state changes that match our prefix
    this.subscribe(StateEventNames.CHANGED, (payload) => {
      if (payload.key.startsWith(this.statePrefix)) {
        const localKey = payload.key.replace(`${this.statePrefix}.`, '') as keyof TState;
        if (localKey in this.state) {
          this.setState(localKey, payload.current as TState[keyof TState], {
            silent: false,
            persist: false,
          });
        }
      }
    });
  }

  /**
   * Called when state changes
   */
  protected onStateChange(key: keyof TState, previous: unknown, current: unknown): void {
    const event: StateChangeEvent = {
      key: String(key),
      component: this.id,
      previous: previous as AppState,
      current: current as AppState,
      changes: { [key]: current },
    };

    // Emit to EventBus
    this.emit(StateEventNames.CHANGED, {
      key: `${this.statePrefix}.${String(key)}`,
      previous: previous as AppState,
      current: current as AppState,
      changes: { [key]: current },
      timestamp: Date.now(),
    });

    // Call abstract handler
    this.handleStateChange(key, previous as TState[keyof TState], current as TState[keyof TState]);
  }

  /**
   * Abstract method for child classes to handle state changes
   */
  protected abstract handleStateChange<K extends keyof TState>(key: K, previous: TState[K], current: TState[K]): void;

  /**
   * Persist a single state key
   */
  private persistStateKey<K extends keyof TState>(key: K, value: TState[K]): void {
    const config = this.stateConfigs.get(key);
    if (!config) return;

    const persistConfig: PersistenceConfig = {
      key: this.statePrefix,
      storage: (config.storage || 'memory') as StorageType,
      version: 1,
    };

    try {
      this.persistenceManager.save(String(key), value, persistConfig);
    } catch (error) {
      this.logError(`Failed to persist state: ${String(key)}`, error);
    }
  }

  /**
   * Persist all state
   */
  private persistState(): void {
    Object.entries(this.state).forEach(([key, value]) => {
      this.persistStateKey(key as keyof TState, value as TState[keyof TState]);
    });
  }

  /**
   * Restore state from storage
   */
  private restoreState(): void {
    this.stateConfigs.forEach((config, key) => {
      const persistConfig: PersistenceConfig = {
        key: this.statePrefix,
        storage: (config.storage || 'memory') as StorageType,
        version: 1,
      };

      try {
        const storedValue = this.persistenceManager.load(String(key), persistConfig);
        if (storedValue !== null) {
          this.setState(key, storedValue as TState[keyof TState], {
            silent: true,
            persist: false,
          });
        }
      } catch (error) {
        this.logError(`Failed to restore state: ${String(key)}`, error);
      }
    });
  }

  /**
   * Check if two values are equal
   */
  private isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    // Simple deep equality check for objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => this.isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }

  /**
   * Create a computed property
   */
  protected createComputed<R>(_dependencies: Array<keyof TState>, compute: (state: TState) => R): () => R {
    return () => compute(this.state);
  }

  /**
   * Watch for state changes with a callback
   */
  protected watchState<K extends keyof TState>(
    key: K,
    callback: (current: TState[K], previous: TState[K]) => void
  ): () => void {
    const handler = (e: Event) => {
      const { detail } = e as CustomEvent<StateChangeEvent>;
      if (detail.key === String(key)) {
        callback(detail.current as TState[K], detail.previous as TState[K]);
      }
    };

    this.rootElement?.addEventListener('state:changed', handler);

    return () => {
      this.rootElement?.removeEventListener('state:changed', handler);
    };
  }
}
