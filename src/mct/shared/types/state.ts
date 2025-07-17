/**
 * State management types for MCT module
 *
 * Contains types related to application state, answers,
 * and data persistence.
 */

import {
  OfferAcceptedENUM,
  ProductsRequestENUM,
  PurchRemoENUM,
  SapValueENUM,
  type CreditImpairedENUM,
  type EndOfTermENUM,
  type FirstTimeBuyerENUM,
  type PropertyTypeENUM,
  type ReadinessToBuyENUM,
  type RemoChangeENUM,
  type RepaymentTypeENUM,
  type ResiBtlENUM,
  type SchemePeriodsENUM,
  type SchemeTypesENUM,
} from './api';
import type { CheckboxValues, NumberValue, RadioValue, SelectValue, TextValue } from './dom';

// Input-related types
export type InputKey = keyof Inputs; // // Initial name of the input group, same as the key in the Inputs object
export type InputName = string; // Final name of the input group, unique identifier based on the InputKey, GroupName and Value if a Radio or Checkbox input
export type InputValue = RadioValue | CheckboxValues | TextValue | NumberValue | SelectValue | undefined; // The value of the input
export type InputPrefillConfig = Record<InputName, InputValue>; // Answers that are prefilled

export enum InputKeysENUM {
  PurchRemo = 'PurchRemo',
  FTB = 'FTB',
  ResiBtl = 'ResiBtl',
  ReadinessToBuy = 'ReadinessToBuy',
  CreditImpaired = 'CreditImpaired',
  PropertyValue = 'PropertyValue',
  DepositAmount = 'DepositAmount',
  RepaymentType = 'RepaymentType',
  InterestOnlyValue = 'InterestOnlyValue',
  MortgageLength = 'MortgageLength',
  SchemeTypes = 'SchemeTypes',
  SchemePeriods = 'SchemePeriods',
  EndOfTerm = 'EndOfTerm',
  RepaymentValue = 'RepaymentValue',
  RemoChange = 'RemoChange',
  Lender = 'Lender',
  NewBuild = 'NewBuild',
  SapValue = 'SapValue',
}

export type Inputs = {
  [InputKeysENUM.PurchRemo]?: keyof typeof PurchRemoENUM; // will have by the end
  [InputKeysENUM.FTB]?: keyof typeof FirstTimeBuyerENUM;
  [InputKeysENUM.ResiBtl]?: keyof typeof ResiBtlENUM; // will have by the end
  [InputKeysENUM.ReadinessToBuy]?: keyof typeof ReadinessToBuyENUM;
  [InputKeysENUM.CreditImpaired]?: keyof typeof CreditImpairedENUM;
  [InputKeysENUM.PropertyValue]?: number; // will have by the end
  // [AnswerKeysENUM.PropertyType]?: keyof typeof PropertyTypeENUM;
  [InputKeysENUM.DepositAmount]?: number;
  [InputKeysENUM.RepaymentType]?: keyof typeof RepaymentTypeENUM; // will have by the end
  [InputKeysENUM.InterestOnlyValue]?: number; // optional?
  [InputKeysENUM.MortgageLength]?: number; // will have by the end
  [InputKeysENUM.SchemeTypes]?: keyof typeof SchemeTypesENUM; // will have by the end
  [InputKeysENUM.SchemePeriods]?: keyof typeof SchemePeriodsENUM; // will have by the end
  [InputKeysENUM.EndOfTerm]?: keyof typeof EndOfTermENUM;
  [InputKeysENUM.RepaymentValue]?: number; // will have by the end
  [InputKeysENUM.RemoChange]?: keyof typeof RemoChangeENUM;
  [InputKeysENUM.Lender]?: string;
  [InputKeysENUM.NewBuild]?: boolean;
  [InputKeysENUM.SapValue]?: keyof typeof SapValueENUM;
};

export type PurchInputs = {
  [InputKeysENUM.FTB]: keyof typeof FirstTimeBuyerENUM;
  [InputKeysENUM.ReadinessToBuy]: keyof typeof ReadinessToBuyENUM;
  [InputKeysENUM.DepositAmount]: number;
};

export type RemoInputs = {
  [InputKeysENUM.EndOfTerm]: keyof typeof EndOfTermENUM;
  [InputKeysENUM.RemoChange]: keyof typeof RemoChangeENUM;
  [InputKeysENUM.Lender]: string;
};

export type InputsByEndOfForm = {
  [InputKeysENUM.PurchRemo]: keyof typeof PurchRemoENUM;
  [InputKeysENUM.ResiBtl]: keyof typeof ResiBtlENUM;
  [InputKeysENUM.CreditImpaired]: keyof typeof CreditImpairedENUM;
  [InputKeysENUM.PropertyValue]: number;
  [InputKeysENUM.RepaymentType]: keyof typeof RepaymentTypeENUM;
  [InputKeysENUM.InterestOnlyValue]: number;
  [InputKeysENUM.MortgageLength]: number;
  [InputKeysENUM.SchemeTypes]: keyof typeof SchemeTypesENUM;
  [InputKeysENUM.SchemePeriods]: keyof typeof SchemePeriodsENUM;
  [InputKeysENUM.RepaymentValue]: number;
  [InputKeysENUM.NewBuild]?: 'true' | 'false';
  [InputKeysENUM.SapValue]?: keyof typeof SapValueENUM;
};

// Calculation-related types
export enum CalculationKeysENUM {
  IsProceedable = 'isProceedable',
  OfferAccepted = 'offerAccepted',
  LTV = 'LTV',
  IncludeRetention = ProductsRequestENUM.IncludeRetention,
  RepaymentValue = InputKeysENUM.RepaymentValue,
  InterestOnlyValue = InputKeysENUM.InterestOnlyValue,
}

export type CalculationKey = keyof typeof CalculationKeysENUM;
export type CalculationValue = string | number | boolean;
export type Calculations = {
  [CalculationKeysENUM.IsProceedable]?: boolean;
  [CalculationKeysENUM.OfferAccepted]?: OfferAcceptedENUM;
  [CalculationKeysENUM.LTV]?: number;
  [CalculationKeysENUM.IncludeRetention]?: boolean;
  [CalculationKeysENUM.RepaymentValue]?: number;
  [CalculationKeysENUM.InterestOnlyValue]?: number;
};

export interface InputData {
  key: InputKey;
  name: InputName;
  value: InputValue;
  source?: 'user' | 'prefill' | 'param';
}

// Application state
export interface AppState {
  lcid: string | null;
  icid: string | null;
  currentStageId: string | null;
  inputs: Inputs;
  inputPrefillConfig: InputPrefillConfig;
  calculations: Calculations;
  mortgageId: number | null;
}
