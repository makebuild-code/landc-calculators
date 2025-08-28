import type { BaseResponse, LenderNames } from './base';

// Options for product requests
export interface ProductsOptions {
  NumberOfResults?: number;
  SortColumn?: SortColumnENUM;
  HelpToBuy?: boolean;
  Offset?: boolean;
  EarlyRepaymentCharge?: boolean;
  NewBuild?: boolean | 'true' | 'false';
  SapValue?: number;
}

export enum ProductsRequestFeaturesENUM {
  HelpToBuy = 'HelpToBuy',
  Offset = 'Offset',
  EarlyRepaymentCharge = 'EarlyRepaymentCharge',
  NewBuild = 'NewBuild',
}

// Features for product requests
export interface ProductsRequestFeatures {
  [ProductsRequestFeaturesENUM.HelpToBuy]?: boolean;
  [ProductsRequestFeaturesENUM.Offset]?: boolean;
  [ProductsRequestFeaturesENUM.EarlyRepaymentCharge]?: boolean;
  [ProductsRequestFeaturesENUM.NewBuild]?: boolean;
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
  TwoYears = '[1]',
  ThreeYears = '[2]',
  FiveYears = '[3]',
  FivePlusYears = '[4]',
  All = '[1, 2, 3, 4]',
}

export const SchemePeriodsMAP = {
  TwoYears: [1],
  ThreeYears: [2],
  FiveYears: [3],
  FivePlusYears: [4],
  All: [1, 2, 3, 4],
} as const;

type SchemePeriodsValue = (typeof SchemePeriodsMAP)[keyof typeof SchemePeriodsMAP];

export enum SchemeTypesENUM {
  Fixed = '[1]',
  Variable = '[2]',
  All = '[1, 2]',
}

export const SchemeTypesMAP = {
  Fixed: [1],
  Variable: [2],
  All: [1, 2],
} as const;

type SchemeTypesValue = (typeof SchemeTypesMAP)[keyof typeof SchemeTypesMAP];

export enum SortColumnENUM {
  Rate = 1,
  AverageAnnualCost = 2,
  MaxLTV = 3,
  MonthlyPayment = 4,
  Lender = 5,
  Fees = 6,
}

export enum SapValueENUM {
  Yes = 100,
  No = 80,
}

export enum ProductsRequestENUM {
  PropertyValue = 'PropertyValue',
  RepaymentValue = 'RepaymentValue',
  PropertyType = 'PropertyType',
  MortgageType = 'MortgageType',
  InterestOnlyValue = 'InterestOnlyValue',
  TermYears = 'TermYears',
  SchemePurpose = 'SchemePurpose',
  SchemePeriods = 'SchemePeriods',
  SchemeTypes = 'SchemeTypes',
  NumberOfResults = 'NumberOfResults',
  Features = 'Features',
  SortColumn = 'SortColumn',
  UseStaticApr = 'UseStaticApr',
  SapValue = 'SapValue',
  Lenders = 'Lenders',
  IncludeRetention = 'IncludeRetention',
  RetentionLenderId = 'RetentionLenderId',
  ShowSharedOwnership = 'ShowSharedOwnership',
}

// Product request structure
export interface ProductsRequest {
  [ProductsRequestENUM.PropertyValue]: number;
  [ProductsRequestENUM.RepaymentValue]: number;
  [ProductsRequestENUM.PropertyType]: PropertyTypeENUM;
  [ProductsRequestENUM.MortgageType]: MortgageTypeENUM;
  [ProductsRequestENUM.InterestOnlyValue]?: number;
  [ProductsRequestENUM.TermYears]: number;
  [ProductsRequestENUM.SchemePurpose]: SchemePurposeENUM;
  [ProductsRequestENUM.SchemePeriods]: SchemePeriodsValue;
  [ProductsRequestENUM.SchemeTypes]: SchemeTypesValue;
  [ProductsRequestENUM.NumberOfResults]: number;
  [ProductsRequestENUM.Features]?: ProductsRequestFeatures;
  [ProductsRequestENUM.SortColumn]: SortColumnENUM;
  [ProductsRequestENUM.UseStaticApr]?: boolean;
  [ProductsRequestENUM.SapValue]?: number;
  [ProductsRequestENUM.Lenders]?: LenderNames;
  [ProductsRequestENUM.IncludeRetention]?: boolean;
  [ProductsRequestENUM.RetentionLenderId]?: number;
  [ProductsRequestENUM.ShowSharedOwnership]?: boolean;
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
