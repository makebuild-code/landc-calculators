import { fetchData } from '../../shared/utils/fetchData';
import { attr } from './constants';
import type { OutputData } from './types';

interface State {
  componentEl: HTMLElement | null;
  outputData: OutputData | null;
  isLoading: boolean;
  error: Error | null;
}

const state: State = {
  componentEl: null,
  outputData: null,
  isLoading: false,
  error: null,
};

export const outputStageManager = {
  initialize(config: OutputStageConfig): void {
    state.config = config;
    this.loadOutputData();
  },

  async loadOutputData(): Promise<void> {
    if (!state.config) return;

    this.setLoading(true);
    try {
      const data = await fetchData<OutputData>(state.config.apiEndpoint);
      this.setOutputData(data);
      this.renderOutput();
    } catch (error) {
      this.setError(error as Error);
      console.error('Failed to initialize output stage:', error);
    } finally {
      this.setLoading(false);
    }
  },

  setLoading(isLoading: boolean): void {
    state.isLoading = isLoading;
  },

  setOutputData(data: OutputData): void {
    state.outputData = data;
  },

  setError(error: Error): void {
    state.error = error;
  },

  setComponent(el: HTMLElement): void {
    state.componentEl = el;
  },

  getComponent(): HTMLElement {
    if (!state.componentEl) throw new Error('Component not set');
    return state.componentEl;
  },

  renderOutput(): void {
    if (!state.outputData) return;

    const outputElements = document.querySelectorAll(`[${attr.element}]`);

    outputElements.forEach((element) => {
      const key = element.getAttribute(attr.output);
      if (key && state.outputData) {
        const value = state.outputData[key];
        if (value !== undefined) {
          const formattedValue = this.formatValue(value);
          element.textContent = formattedValue;
        }
      }
    });
  },

  formatValue(value: string | number): string {
    return value.toString();
  },

  // Public methods for external access to state
  getState(): State {
    return { ...state };
  },

  getOutputData(): OutputData | null {
    return state.outputData;
  },

  isLoading(): boolean {
    return state.isLoading;
  },

  getError(): Error | null {
    return state.error;
  },
};
