import { StatefulComponent, type StatefulComponentOptions, type StatefulManagerState } from '$mct/components';
import type { QuestionComponent } from './Questions';

export interface NewBaseGroupState {
  name: string;
  index: number;
  isVisible: boolean;
}

export interface NewBaseGroupOptions<T extends NewBaseGroupState = NewBaseGroupState>
  extends Omit<StatefulComponentOptions<T>, 'initialState'> {
  extendedInitialState?: Partial<T>;
  initialState?: T;
  name: string;
  index: number;
}

export abstract class NewBaseGroup<T extends NewBaseGroupState = NewBaseGroupState> extends StatefulComponent<T> {
  constructor(options: NewBaseGroupOptions<T>) {
    const finalInitialState =
      options.initialState ||
      (() => {
        // Create base initialState
        const baseInitialState: NewBaseGroupState = {
          name: options.name,
          index: options.index,
          isVisible: false,
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

export interface NewQuestionGroupState extends NewBaseGroupState {
  questions: QuestionComponent[];
  activeQuestionIndex: number;
}

export interface NewQuestionGroupOptions<T extends NewQuestionGroupState = NewQuestionGroupState>
  extends Omit<NewBaseGroupOptions<T>, 'initialState'> {
  extendedInitialState?: Partial<T>;
  initialState?: T;
}

export abstract class NewQuestionGroup extends NewBaseGroup {
  constructor(options: NewQuestionGroupOptions) {
    super(options);
  }

  abstract handleChange(index: number): void;
}
