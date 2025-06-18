import type { BaseResponse } from './baseResponse';

export interface ProductsRequest {
  PropertyValue: number;
  RepaymentValue: number;
  PropertyType: 1 | 2;
  MortgageType: 1 | 2;
  InterestOnlyValue: number;
  TermYears: number;
  SchemePurpose: 1 | 2;
  SchemePeriods: (1 | 2 | 3 | 4)[];
  SchemeTypes: (1 | 2)[];
  NumberOfResults: number;
  Features: {
    HelpToBuy?: boolean;
    Offset?: boolean;
    EarlyRepaymentCharge?: boolean;
    NewBuild?: boolean;
    [key: string]: boolean | undefined;
  };
  SortColumn: 1 | 2 | 3 | 4 | 5 | 6;
  UseStaticApr: boolean;
  SapValue: number;
  Lenders: string;
  IncludeRetention: boolean;
  RetentionLenderId: number | string;
}

export interface SummaryInfo {
  LowestRate: number;
  LowestPMT: number;
  LowestAnnualCost: number;
  NumberOfLenders: number;
  NumberOfProducts: number;
}

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

export interface ProductsResponseData {
  SummaryInfo: SummaryInfo;
  Products: Product[];
}

export type ProductsResponse = BaseResponse<ProductsResponseData>;
