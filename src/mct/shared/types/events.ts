import type { InputData, AppState, StageIDENUM, InputValue } from '$mct/types';
import type { QuestionComponent } from 'src/mct/stages/form/Questions';

/**
 * Event listener tracking interface
 * Used for managing event listeners across the application
 *
 * @example
 * ```typescript
 * import type { TrackedEventListener } from '$mct/types';
 *
 * class MyComponent {
 *   private eventListeners: TrackedEventListener[] = [];
 *
 *   private addTrackedListener(
 *     element: EventTarget,
 *     event: string,
 *     handler: EventListener,
 *     options?: AddEventListenerOptions
 *   ): void {
 *     element.addEventListener(event, handler, options);
 *     this.eventListeners.push({ element, event, handler, options });
 *   }
 *
 *   private cleanup(): void {
 *     this.eventListeners.forEach(({ element, event, handler, options }) => {
 *       element.removeEventListener(event, handler, options);
 *     });
 *     this.eventListeners = [];
 *   }
 * }
 * ```
 */
export interface TrackedEventListener {
  element: EventTarget;
  event: string;
  handler: EventListener;
  options?: AddEventListenerOptions;
}

export enum MCTEventNames {
  STAGE_COMPLETE = 'mct:stage:complete',
}

export enum FormEventNames {
  QUESTION_CHANGED = 'form:question:changed',
  QUESTION_VALIDATED = 'form:question:validated',
  QUESTION_REQUIRED = 'form:question:required',
  QUESTION_UNREQUIRED = 'form:question:unrequired',
  QUESTIONS_SAVE_REQUESTED = 'form:questions:save:requested',
  QUESTIONS_SYNC_REQUESTED = 'form:questions:sync:requested',
  INPUT_CHANGED = 'input:changed',
  INPUT_ON_ENTER = 'input:on-enter',
  GROUP_CHANGED = 'form:group:changed',
  GROUP_SHOWN = 'form:group:shown',
  GROUP_HIDDEN = 'form:group:hidden',
  GROUP_INITIALIZED = 'form:group:initialized',
  GROUP_COMPLETED = 'form:group:completed',
  GROUP_READY = 'form:group:ready',
  NAVIGATION_UPDATE = 'form:navigation:update',
  NAVIGATION_NEXT = 'form:navigation:next',
  NAVIGATION_PREV = 'form:navigation:prev',
  ANSWERS_SAVED = 'form:answers:saved',
  ANSWERS_LOADED = 'form:answers:loaded',
  INITIALIZED = 'form:initialized',
  COMPLETED = 'form:completed',
  HEADER_UPDATE = 'form:header:update',
  RESULTS_READY = 'form:results:ready',
}

export enum StateEventNames {
  CHANGED = 'state:changed',
  LOADED = 'state:loaded',
  SAVED = 'state:saved',
}

export enum APIEventNames {
  REQUEST_START = 'api:request:start',
  REQUEST_SUCCESS = 'api:request:success',
  REQUEST_ERROR = 'api:request:error',
}

/**
 * Typed event definitions for the MCT application
 * This provides type safety for event payloads
 */

export interface MCTEvents {
  [MCTEventNames.STAGE_COMPLETE]: {
    stageId: StageIDENUM;
  };
}

export interface FormEvents {
  // Question-related events
  [FormEventNames.QUESTION_CHANGED]: {
    question: QuestionComponent;
    name: string;
    groupName: string;
    value: InputValue;
    source: 'main' | 'sidebar';
  };

  [FormEventNames.QUESTION_VALIDATED]: {
    question: QuestionComponent;
    name: string;
    isValid: boolean;
  };

  [FormEventNames.QUESTION_REQUIRED]: {
    question: QuestionComponent;
    questionId: string;
    groupName: string;
  };

  [FormEventNames.QUESTION_UNREQUIRED]: {
    question: QuestionComponent;
    questionId: string;
    groupName: string;
  };

  [FormEventNames.QUESTIONS_SAVE_REQUESTED]: {
    source: 'main' | 'sidebar';
  };

  [FormEventNames.QUESTIONS_SYNC_REQUESTED]: {
    targetQuestionId: string;
    value: InputValue;
    source: 'main' | 'sidebar';
  };

  // // Input-related events
  // [FormEventNames.INPUT_CHANGED]: {
  //   question: QuestionComponent;
  // };

  // [FormEventNames.INPUT_ON_ENTER]: {
  //   question: QuestionComponent;
  // };

  // Group-related events
  [FormEventNames.GROUP_CHANGED]: {
    previousIndex: number;
    currentIndex: number;
    groupId: string;
  };

  [FormEventNames.GROUP_SHOWN]: {
    groupId: string;
  };

  [FormEventNames.GROUP_HIDDEN]: {
    groupId: string;
  };

  [FormEventNames.GROUP_INITIALIZED]: {
    groupId: string;
    questionCount: number;
  };

  [FormEventNames.GROUP_COMPLETED]: {
    groupId: string;
    answers: InputData[];
  };

  [FormEventNames.GROUP_READY]: {
    groupId: string;
    canProceed: boolean;
  };

  // Navigation events
  [FormEventNames.NAVIGATION_UPDATE]: {
    nextEnabled?: boolean;
    prevEnabled?: boolean;
  };

  [FormEventNames.NAVIGATION_NEXT]: {
    fromGroup: string;
    // toGroup: string;
  };

  [FormEventNames.NAVIGATION_PREV]: {
    fromGroup: string;
    // toGroup: string;
  };

  // Answer-related events
  [FormEventNames.ANSWERS_SAVED]: {
    answers: InputData[];
    source?: 'main' | 'sidebar';
  };

  [FormEventNames.ANSWERS_LOADED]: {
    answers: InputData[];
  };

  // Form lifecycle events
  [FormEventNames.INITIALIZED]: {
    totalGroups: number;
    totalQuestions: number;
  };

  [FormEventNames.COMPLETED]: {
    totalAnswers: number;
  };

  [FormEventNames.HEADER_UPDATE]: {
    headerData: Record<string, any>;
    source: string;
  };

  [FormEventNames.RESULTS_READY]: {
    answers: InputData[];
    canShowResults: boolean;
  };
}

export interface StateEvents {
  [StateEventNames.CHANGED]: {
    changes: Partial<AppState>;
    previousState: AppState;
    currentState: AppState;
  };

  [StateEventNames.LOADED]: {
    state: AppState;
  };

  [StateEventNames.SAVED]: {
    state: AppState;
  };
}

export interface APIEvents {
  [APIEventNames.REQUEST_START]: {
    endpoint: string;
    method: string;
  };

  [APIEventNames.REQUEST_SUCCESS]: {
    endpoint: string;
    method: string;
    response: any;
  };

  [APIEventNames.REQUEST_ERROR]: {
    endpoint: string;
    method: string;
    error: Error;
  };
}

// Combine all event types
export interface AllEvents extends MCTEvents, FormEvents, StateEvents, APIEvents {}

// Type helpers
export type EventName = keyof AllEvents;
export type EventPayload<T extends EventName> = AllEvents[T];

// Event categories for easier filtering
export const EVENT_CATEGORIES = {
  MCT: 'mct:',
  FORM: 'form:',
  RESULTS: 'results:',
  APPOINTMENT: 'appointment:',
  STATE: 'state:',
  API: 'api:',
} as const;
