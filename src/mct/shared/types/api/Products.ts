import type { BaseResponse, LenderNames } from './base';

// Options for product requests
export interface ProductsOptions {
  numberOfResults?: number;
  sortColumn?: SortColumnENUM;
  HelpToBuy?: boolean;
  Offset?: boolean;
  EarlyRepaymentCharge?: boolean;
  NewBuild?: boolean;
  SapValue?: number;
}

// Features for product requests
export interface Features {
  HelpToBuy?: boolean;
  Offset?: boolean;
  EarlyRepaymentCharge?: boolean;
  NewBuild?: boolean;
}

export enum PropertyTypeENUM {
  House = 1,
  Flat = 2,
}

export enum MortgageTypeENUM {
  Residential = 1,
  Btl = 2,
}

export enum SchemePurposeENUM {
  Purchase = 1,
  Remortgage = 2,
}

export enum SchemePeriodsENUM {
  TwoYears = 1,
  ThreeYears = 2,
  FiveYears = 3,
  FivePlusYears = 4,
}

export enum SchemeTypesENUM {
  Fixed = 1,
  Variable = 2,
}

export enum SortColumnENUM {
  Rate = 1,
  AverageAnnualCost = 2,
  MaxLTV = 3,
  MonthlyPayment = 4,
  Lender = 5,
  Fees = 6,
}

export enum SapValueENUM {
  Yes = 81,
  No = 1,
}

// Product request structure
export interface ProductsRequest {
  PropertyValue: number;
  RepaymentValue: number;
  PropertyType: PropertyTypeENUM;
  MortgageType: MortgageTypeENUM;
  InterestOnlyValue?: number;
  TermYears: number;
  SchemePurpose: SchemePurposeENUM;
  SchemePeriods: SchemePeriodsENUM[];
  SchemeTypes: SchemeTypesENUM[];
  NumberOfResults: number;
  Features?: Features;
  SortColumn: SortColumnENUM;
  UseStaticApr?: boolean;
  SapValue?: number;
  Lenders?: LenderNames;
  IncludeRetention?: boolean;
  RetentionLenderId?: number;
}

// Summary information
export interface SummaryInfo {
  LowestRate: number;
  LowestPMT: number;
  LowestAnnualCost: number;
  NumberOfLenders: number;
  NumberOfProducts: number;
}

// Product structure
export interface Product {
  ProductId: number;
  LenderId: number;
  LenderName: string;
  DirectToLender: boolean;
  ApplyDirectLink: string;
  LenderURL: string;
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
  SAP: number;
  SharedOwnership: string;
  NewBuild: string;
  Offset: boolean;
  LtdCompany: string;
  HMO: boolean;
  Channel: string;
  AvailableFor: string;
}

// API response structures
export interface ProductsResponseData {
  SummaryInfo: SummaryInfo;
  Products: Product[];
}

export type ProductsResponse = BaseResponse<ProductsResponseData>;
