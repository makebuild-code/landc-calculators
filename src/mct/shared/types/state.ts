/**
 * State management types for MCT module
 *
 * Contains types related to application state, answers,
 * and data persistence.
 */

import type { Product, SummaryInfo } from './api';

// Answer-related types
export type AnswerID = string;
export type AnswerKey = string;
export type AnswerValue = string | number | (string | number)[] | null;
export type Answers = Record<AnswerKey, AnswerValue>;
export type PrefillAnswers = Record<AnswerID, AnswerValue>;

export interface AnswerData {
  key: AnswerKey;
  id: AnswerID;
  value: AnswerValue;
  source?: 'user' | 'prefill' | 'param';
}

// Application state
export interface AppState {
  lcid: string | null;
  icid: string | null;
  currentStageId: string | null;
  answers: Answers;
  prefillAnswers: PrefillAnswers;
  // summary: SummaryInfo | null;
  // products: Product[] | null;
}

// Storage-related types
export interface MCTData {
  lcid?: string | null;
  icid?: string | null;
  answers?: Answers;
}
