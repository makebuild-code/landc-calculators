import { StorageManager } from './StorageManager';
import { StatePersistenceManager } from './persistence';
import type {
  AppState,
  InputKey,
  InputValue,
  Inputs,
  InputData,
  InputPrefillConfig,
  StageIDENUM,
  Calculations,
} from '$mct/types';

export interface StateChangeEvent {
  previousState: AppState;
  currentState: AppState;
  changes: Partial<AppState>;
}

type StateSubscriber = (event: StateChangeEvent) => void;

const defaultState: AppState = {
  lcid: null,
  icid: null,
  currentStageId: null,
  inputs: {},
  inputPrefillConfig: {},
  calculations: {} as Calculations,
  mortgageId: null,
  answers: {},
  product: {},
  appointment: {},
  form: {},
};

export class StateManager {
  private state: AppState;
  private subscribers: Set<StateSubscriber>;
  private storage: StorageManager;
  private persistence: StatePersistenceManager;

  constructor(initialState?: Partial<AppState>) {
    this.state = { ...defaultState, ...initialState };
    this.subscribers = new Set();
    this.storage = new StorageManager();
    this.persistence = new StatePersistenceManager(this.storage);
  }

  /**
   * Subscribe to state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: StateSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Update state with new values
   */
  setState(updates: Partial<AppState>): void {
    const previousState = { ...this.state };
    const changes = { ...updates };

    // Apply updates
    this.state = { ...this.state, ...updates };

    // Notify subscribers
    const event: StateChangeEvent = {
      previousState,
      currentState: this.state,
      changes,
    };

    this.subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('State subscriber error:', error);
      }
    });
  }

  /**
   * Get current state (immutable copy)
   */
  getState(): AppState {
    return { ...this.state };
  }

  /**
   * Get a specific piece of state
   */
  get<K extends keyof AppState>(key: K): AppState[K] {
    return this.state[key];
  }

  /**
   * Set a specific piece of state
   */
  set<K extends keyof AppState>(key: K, value: AppState[K]): void {
    this.setState({ [key]: value } as Partial<AppState>);
  }

  // Convenience methods for common state operations
  setLCID(lcid: string | null): void {
    console.log('setting lcid', lcid);
    this.set('lcid', lcid);
  }

  getLCID(): string | null {
    return this.get('lcid');
  }

  setICID(icid: string | null): void {
    this.set('icid', icid);
  }

  getICID(): string | null {
    return this.get('icid');
  }

  setCurrentStage(stageId: string | null): void {
    this.set('currentStageId', stageId);
  }

  getCurrentStage(): StageIDENUM {
    return this.get('currentStageId') as StageIDENUM;
  }

  setAnswer(answerData: InputData): void {
    answerData = {
      ...answerData,
      source: answerData.source || 'user',
    };

    const answers = { ...this.state.inputs, [answerData.key]: answerData.value };
    const prefillAnswers = { ...this.state.inputPrefillConfig, [answerData.name]: answerData.value };

    this.setState({ inputs: answers, inputPrefillConfig: prefillAnswers });
  }

  getAnswer(key: InputKey): InputValue | undefined {
    return this.state.inputs[key] as InputValue | undefined;
  }

  setAnswers(answerDataArray: InputData[]): void {
    const answers = answerDataArray.reduce<Partial<Inputs>>((acc, answer) => {
      acc[answer.key] = answer.value as any;
      return acc;
    }, {} as Inputs);

    const prefillAnswers = answerDataArray.reduce((acc, answer) => {
      acc[answer.name] = answer.value;
      return acc;
    }, {} as InputPrefillConfig);

    this.setState({ inputs: answers, inputPrefillConfig: prefillAnswers });
  }

  getAnswers(): Inputs {
    return { ...this.state.inputs };
  }

  setPrefillValues(prefillData: InputPrefillConfig): void {
    this.set('inputPrefillConfig', { ...this.state.inputPrefillConfig, ...prefillData });
  }

  getPrefillAnswers(): InputPrefillConfig {
    return { ...this.state.inputPrefillConfig };
  }

  setCalculations(calculations: Partial<Calculations>): void {
    this.set('calculations', { ...this.state.calculations, ...calculations });
  }

  getCalculations(): Calculations {
    return { ...this.state.calculations };
  }

  // clearAnswer(key: AnswerKey): void {
  //   const answers = { ...this.state.answers };
  //   delete answers[key];
  //   this.set('answers', answers);
  // }

  // clearAnswers(): void {
  //   this.set('answers', {});
  // }

  /**
   * Reset state to default values
   */
  reset(): void {
    this.setState(defaultState);
  }

  /**
   * Get storage manager for persistence operations
   */
  getStorage(): StorageManager {
    return this.storage;
  }

  /**
   * Load state from persistence
   */
  loadFromPersistence(): void {
    const persistedState = this.persistence.loadState();
    if (Object.keys(persistedState).length > 0) {
      this.setState(persistedState);
    }
  }

  /**
   * Save current state to persistence
   */
  saveToPersistence(): void {
    this.persistence.saveState(this.state);
  }

  /**
   * Clear all persisted state
   */
  clearPersistence(): void {
    this.persistence.clearAll();
  }

  /**
   * Auto-save state changes to persistence
   */
  enableAutoPersistence(): void {
    this.subscribe(() => {
      this.saveToPersistence();
    });
  }
}
