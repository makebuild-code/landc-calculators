/**
 * State management types for MCT module
 *
 * Contains types related to application state, answers,
 * and data persistence.
 */

import type {
  CreditImpairedENUM,
  EndOfTermENUM,
  FirstTimeBuyerENUM,
  PurchRemoENUM,
  ReadinessToBuyENUM,
  RemoChangeENUM,
  RepaymentTypeENUM,
  ResiBtlENUM,
  SchemePeriodsENUM,
  SchemeTypesENUM,
} from './api';

// Answer-related types
export type AnswerKey = string; // Name of the question group
export type AnswerName = string; // Name of the answer input
export type AnswerValue = string | number | (string | number)[] | null; // Value of the answer input
// export type Answers = Record<AnswerKey, AnswerValue>; // All answers
export type Answers = {
  PurchRemo?: PurchRemoENUM; // will have by the end
  FTB?: FirstTimeBuyerENUM;
  ResiBtl?: ResiBtlENUM; // will have by the end
  ReadinessToBuy?: ReadinessToBuyENUM;
  CreditImpaired?: CreditImpairedENUM;
  PropertyValue?: number; // will have by the end
  DepositAmount?: number;
  RepaymentType?: RepaymentTypeENUM; // will have by the end
  InterestOnlyValue?: number; // optional?
  MortgageLength?: number; // will have by the end
  SchemeTypes?: SchemeTypesENUM[]; // will have by the end
  SchemePeriods?: SchemePeriodsENUM; // will have by the end
  EndOfTerm?: EndOfTermENUM;
  RepaymentValue?: number; // will have by the end
  RemoChange?: RemoChangeENUM;
  Lender?: string;
};
export type PrefillAnswers = Record<AnswerName, AnswerValue>; // Answers that are prefilled

// Calculation-related types
export type CalculationKey =
  | 'isProceedable'
  | 'offerAccepted'
  | 'LTV'
  | 'IncludeRetention'
  | 'RepaymentValue'
  | 'InterestOnlyValue';
export type CalculationValue = string | number | boolean;
export type Calculations = Record<CalculationKey, CalculationValue>; // All calculations

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
