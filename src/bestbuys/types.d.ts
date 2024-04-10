import type { Result } from 'src/types';

export type PropertyType = '1' | '2';
export type MortgageType = '1' | '2';
export type SchemePurpose = '1' | '2';
export type SchemePeriods = '1' | '2' | '3' | '4';
export type SchemeTypes = '1' | '2';
export type SortColumn = '1' | '2' | '3' | '4' | '5' | '6';

export interface Inputs {
  PropertyValue: string; // Market value of property
  PropertyType: PropertyType; // 1 for house; 2 for flat
  MortgageType: MortgageType; // 1 for Residential; 2 for Buy to Let
  RepaymentValue: string; // Repayment amount
  InterestOnlyValue: string; // Interest only value
  TermYears: string; // Mortgage term in whole years
  SchemePurpose: SchemePurpose; // Mortgage purpose - 1 for Purchase; 2 for Remortgage
  SchemePeriods: SchemePeriods[]; // Array of mortgage scheme durations to include one or more options
  SchemeTypes: SchemeTypes[]; // Array of scheme types to include. Fixed (1); Variable (2)
  NumberOfResults: string; // Total number of products to return. Defaults to 10.
  Features: {
    Erc: boolean;
    Offset: boolean;
  }; // Any additional product features to include or use
  SortColumn: SortColumn; // Numeric representations for sort columns
  UseStaticApr: boolean; // Indicating whether to use a static APR (driven from the database).
}

export interface Outputs {
  ProductId: number;
  LenderName: string;
  LenderURL: URL;
  ProductSchemeFriendlyName: string;
  Rate: number;
  FollowOnRate: string;
  PMT: number;
  FutureValue: number;
  FutureMonthlyPayment: number;
  TotalFees: number;
  AnnualCost: number;
  ApplicationFee: number;
  CompletionFee: number;
  ValuationFee: number;
  OtherFees: number;
  Cashback: number;
  BrokerFee: number;
  OverpaymentLimit: string;
  ERC: string;
  ERCText: string;
  ExitFee: number;
  Legals: string;
  MinimumMortgageAmount: number;
  MaximumMortgageAmount: number;
  LTV: number;
  APR: number;
  FollowOnRateValue: number;
  SchemeLength: number;
  SchemeTypeRefId: number;
  IsRemortgage: boolean;
  RepresentativeExample: string;
}

export interface BestBuyResult {
  success: boolean;
  data: Result[];
}
