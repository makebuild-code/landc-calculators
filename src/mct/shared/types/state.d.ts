/**
 * State management types for MCT module
 *
 * Contains types related to application state, answers,
 * and data persistence.
 */

// Answer-related types
export type AnswerKey = string;
export type AnswerValue = string | number | (string | number)[] | null;
export type Answers = Record<AnswerKey, AnswerValue>;

// Application state
export interface AppState {
  lcid: string | null;
  icid: string | null;
  currentStageId: string | null;
  answers: Answers;
  summary: import('./api').SummaryInfo | null;
  products: import('./api').Product[] | null;
}

// Storage-related types
export interface MCTData {
  lcid?: string | null;
  icid?: string | null;
  answers?: Answers;
}
