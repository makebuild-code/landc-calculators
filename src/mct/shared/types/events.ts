import type { AnswerData, AppState } from '$mct/types';

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

/**
 * Typed event definitions for the MCT application
 * This provides type safety for event payloads
 */
export interface FormEvents {
  // Question-related events
  'form:question:changed': {
    questionId: string;
    value: any;
    isValid: boolean;
    groupName: string;
  };

  'form:question:validated': {
    questionId: string;
    isValid: boolean;
    errors: string[];
  };

  'form:question:required': {
    data: AnswerData;
  };

  'form:question:unrequired': {
    data: AnswerData;
  };

  // Group-related events
  'form:group:changed': {
    groupId: string;
    activeQuestionIndex: number;
    totalQuestions: number;
  };

  'form:group:shown': {
    groupId: string;
  };

  'form:group:hidden': {
    groupId: string;
  };

  // Navigation events
  'form:navigation:update': {
    nextEnabled: boolean;
    prevEnabled: boolean;
  };

  'form:navigation:next': {
    fromGroup: string;
    // toGroup: string;
  };

  'form:navigation:prev': {
    fromGroup: string;
    // toGroup: string;
  };

  // Answer-related events
  'form:answers:saved': {
    answers: AnswerData[];
  };

  'form:answers:loaded': {
    answers: AnswerData[];
  };

  // Form lifecycle events
  'form:initialized': {
    totalGroups: number;
    totalQuestions: number;
  };

  'form:completed': {
    totalAnswers: number;
  };
}

export interface StateEvents {
  'state:changed': {
    changes: Partial<AppState>;
    previousState: AppState;
    currentState: AppState;
  };

  'state:loaded': {
    state: AppState;
  };

  'state:saved': {
    state: AppState;
  };
}

export interface APIEvents {
  'api:request:start': {
    endpoint: string;
    method: string;
  };

  'api:request:success': {
    endpoint: string;
    method: string;
    response: any;
  };

  'api:request:error': {
    endpoint: string;
    method: string;
    error: Error;
  };
}

// Combine all event types
export interface AllEvents extends FormEvents, StateEvents, APIEvents {}

// Type helpers
export type EventName = keyof AllEvents;
export type EventPayload<T extends EventName> = AllEvents[T];

// Event categories for easier filtering
export const EVENT_CATEGORIES = {
  FORM: 'form:',
  RESULTS: 'results:',
  APPOINTMENT: 'appointment:',
  STATE: 'state:',
  API: 'api:',
} as const;
