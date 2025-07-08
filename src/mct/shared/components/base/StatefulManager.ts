import type { StageIDENUM } from '$mct/types';
import { StatefulComponent, type StatefulComponentOptions } from './StatefulComponent';

export interface StatefulManagerState {
  id: StageIDENUM;
  isVisible: boolean;
  isComplete: boolean;
}

export interface StatefulManagerOptions<T extends StatefulManagerState = StatefulManagerState>
  extends Omit<StatefulComponentOptions<T>, 'initialState'> {
  extendedInitialState?: Partial<T>; // Additional state properties for extending classes
  initialState?: T; // Optional - will be auto-generated if extendedInitialState is provided
  id: StageIDENUM;
}

export abstract class StatefulManager<
  T extends StatefulManagerState = StatefulManagerState,
> extends StatefulComponent<T> {
  constructor(options: StatefulManagerOptions<T>) {
    // Use provided initialState or generate from base + extended
    const finalInitialState =
      options.initialState ||
      (() => {
        // Create base initialState
        const baseInitialState: StatefulManagerState = {
          id: options.id,
          isVisible: false,
          isComplete: false,
        };

        // Merge base state with extended state
        return {
          ...baseInitialState,
          ...options.extendedInitialState,
        } as T;
      })();

    super({
      ...options,
      initialState: finalInitialState,
    });
  }

  protected onInit(): void {
    // Bind event listeners using new component system
    if (this.autoBindEvents) this.bindEvents();
  }
}
