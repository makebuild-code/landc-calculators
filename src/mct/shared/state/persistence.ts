import type { StorageConfig, StorageManager } from './StorageManager';
import type { AppState } from '$mct/types';

/**
 * Configuration for how different parts of the state should be persisted
 */
export const PERSISTENCE_CONFIG: Record<keyof AppState, StorageConfig> = {
  lcid: {
    type: 'cookie',
    key: 'LCID',
    serialize: false,
  },
  icid: {
    type: 'cookie',
    key: 'ICID',
    serialize: false,
  },
  currentStageId: {
    type: 'sessionStorage',
    key: 'mct_current_stage',
    serialize: false,
  },
  inputs: {
    type: 'localStorage',
    key: 'mct_inputs',
    serialize: true,
  },
  inputPrefill: {
    type: 'sessionStorage',
    key: 'mct_inputs_prefill',
    serialize: true,
  },
  calculations: {
    type: 'localStorage',
    key: 'mct_calculations',
    serialize: true,
  },
  filters: {
    type: 'memory',
    key: 'mct_filters',
    serialize: false,
  },
  product: {
    type: 'sessionStorage',
    key: 'mct_product',
    serialize: false,
  },
  booking: {
    type: 'sessionStorage',
    key: 'mct_appointment',
    serialize: true,
  },
  form: {
    type: 'sessionStorage',
    key: 'mct_form',
    serialize: true,
  },
};

/**
 * State persistence manager that handles saving and loading state
 */
export class StatePersistenceManager {
  private storage: StorageManager;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  /**
   * Save the entire state according to persistence configuration
   */
  saveState(state: AppState): void {
    Object.entries(PERSISTENCE_CONFIG).forEach(([key, config]) => {
      const value = state[key as keyof AppState];
      if (value !== null && value !== undefined) {
        this.storage.set(config, value);
      }
    });
  }

  /**
   * Load the entire state according to persistence configuration
   */
  loadState(): Partial<AppState> {
    const loadedState: Partial<AppState> = {};

    Object.entries(PERSISTENCE_CONFIG).forEach(([key, config]) => {
      const value = this.storage.get(config);
      if (value !== null && value !== undefined) {
        loadedState[key as keyof AppState] = value;
      }
    });

    return loadedState;
  }

  /**
   * Save a specific piece of state
   */
  saveStateItem<K extends keyof AppState>(key: K, value: AppState[K]): void {
    const config = PERSISTENCE_CONFIG[key];
    if (config && value !== null && value !== undefined) {
      this.storage.set(config, value);
    }
  }

  /**
   * Load a specific piece of state
   */
  loadStateItem<K extends keyof AppState>(key: K): AppState[K] | null {
    const config = PERSISTENCE_CONFIG[key];
    if (config) {
      return this.storage.get(config);
    }
    return null;
  }

  /**
   * Clear all persisted state
   */
  clearAll(): void {
    Object.values(PERSISTENCE_CONFIG).forEach((config) => {
      this.storage.remove(config);
    });
  }

  /**
   * Clear a specific piece of persisted state
   */
  clearItem<K extends keyof AppState>(key: K): void {
    const config = PERSISTENCE_CONFIG[key];
    if (config) {
      this.storage.remove(config);
    }
  }
}
