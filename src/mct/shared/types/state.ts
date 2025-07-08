/**
 * State management types for MCT module
 *
 * Contains types related to application state, answers,
 * and data persistence.
 */

import type { Product, ProductsRequest, SummaryInfo } from './api';

// Answer-related types
export type AnswerKey = string; // Name of the question group
export type AnswerName = string; // Name of the answer input
export type AnswerValue = string | number | (string | number)[] | null; // Value of the answer input
export type Answers = Record<AnswerKey, AnswerValue>; // All answers
export type PrefillAnswers = Record<AnswerName, AnswerValue>; // Answers that are prefilled
export type Calculations = Record<string, string | number | boolean>; // All calculations

export interface AnswerData {
  key: AnswerKey;
  name: AnswerName;
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
  calculations: Calculations;
  mortgageId: number | null;
}

// Storage-related types
export interface MCTData {
  lcid?: string | null;
  icid?: string | null;
  answers?: Answers;
}
