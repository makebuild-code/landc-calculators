import type { BaseResponse } from './baseResponse';

/**
 * PropertyValue
 * RepaymentValue
 * PropertyType
 * MortgageType
 * TermYears
 * SchemePurpose
 * NumberOfResults
 * SortColumn
 */
export interface ProductsRequest {
  PropertyValue: number;
  RepaymentValue: number;
  PropertyType: 1 | 2; // 1 = house, 2 = flat
  MortgageType: 1 | 2; // 1 = residential, 2 = buy to let
  InterestOnlyValue?: number;
  TermYears: number;
  SchemePurpose: 1 | 2; // 1 = purchase, 2 = remortgage
  SchemePeriods?: (1 | 2 | 3 | 4)[]; // 1 = 2 years, 2 = 3 years, 3 = 5 years, 4 = 5+ years
  SchemeTypes?: (1 | 2)[]; // 1 = fixed, 2 = variable
  NumberOfResults: number;
  Features?: {
    HelpToBuy?: boolean;
    Offset?: boolean;
    EarlyRepaymentCharge?: boolean;
    NewBuild?: boolean;
  };
  SortColumn: 1 | 2 | 3 | 4 | 5 | 6; // 1 = rate, 2 = average annual cost, 3 = max ltv, 4 = monthly payment, 5 = lender, 6 = fees
  UseStaticApr?: boolean;
  SapValue?: number;
  Lenders?: string; // csv string of master lender ids to filter by Else empty OR null to bring back all lenders
  IncludeRetention?: boolean;
  RetentionLenderId?: number;
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
