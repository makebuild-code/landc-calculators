import type { StageIDENUM } from '$mct/types';
import { StatefulComponent, type StatefulComponentConfig } from './StatefulComponent';

export interface StatefulManagerState {
  id: StageIDENUM;
  isVisible: boolean;
  isComplete: boolean;
}

export interface StatefulManagerConfig extends StatefulComponentConfig {
  id: StageIDENUM;
}

export abstract class StatefulManager<
  T extends StatefulManagerState = StatefulManagerState,
> extends StatefulComponent<T> {
  constructor(
    config: StatefulManagerConfig,
    customState?: Partial<T>
  ) {
    const initialState: T = {
      // Base state
      id: config.id,
      isVisible: false,
      isComplete: false,
      // Custom state extensions
      ...customState
    } as T;
    
    super(config, initialState);
  }

  protected onInit(): void {
    // Bind event listeners using new component system
    if (this.autoBindEvents) this.bindEvents();
  }
}
