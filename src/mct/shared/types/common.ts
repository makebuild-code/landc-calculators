/**
 * Common/shared types for MCT module
 *
 * Contains types that are used across multiple domains
 * or are general-purpose types.
 */

import type { ICID, LCID } from './api';

export type Breakpoint = 'desktop' | 'tablet' | 'landscape' | 'portrait';
export type ResponsiveConfig = {
  [T in Breakpoint]: number;
};

// Profile-related types
export enum ProfileNameENUM {
  ResidentialPurchase = 'residential-purchase',
  FtbResidentialPurchase = 'ftb-residential-purchase',
  BtlPurchase = 'btl-purchase',
  ResidentialRemortgage = 'residential-remortgage',
  BtlRemortgage = 'btl-remortgage',
}

// LandC BuyerTypes
export enum BuyerTypeENUM {
  ResidentialPurchase = 'Residential purchase',
  FtbResidentialPurchase = 'First Time Buyer',
  BtlPurchase = 'Buy-to-let purchase',
  ResidentialRemortgage = 'Residential remortgage',
  BtlRemortgage = 'Buy-to-let remortgage',
}

export enum GroupNameENUM {
  CustomerIdentifier = 'customer-identifier',
  ResidentialPurchase = 'residential-purchase',
  FtbResidentialPurchase = 'ftb-residential-purchase',
  BtlPurchase = 'btl-purchase',
  ResidentialRemortgage = 'residential-remortgage',
  BtlRemortgage = 'btl-remortgage',
  Output = 'output',
}

export interface Profile {
  name: ProfileNameENUM;
  display: string;
  requirements: {
    [key: string]: string;
  };
}

export interface OEF_PARAMS {
  PurchaseOrRemortgage?: string;
  ResidentialOrBuyToLet?: string;
  CreditIssues?: string;
  PropertyValue?: string;
  LoanAmount?: string;
  Term?: string;
  MortgageRepaymentType?: string;
  OfferAccepted?: string;
  Icid: ICID;
  StageOfJourney?: string;
  LcId: LCID;
}

// Form options
export interface FormOptions {
  mode: 'main' | 'sidebar';
  prefill: boolean;
}

// API options
export interface APIOptions {
  numberOfResults?: number;
  sortColumn?: number;
}

// Summary lines for display
export interface SummaryLines {
  BorrowOverTerm: string;
  SchemeAndType: string;
  ProductsAndLenders: string;
  DealsAndRates: string;
  Summary: string;
}

// Input group options
export type InputGroupOptions = {
  onChange: () => void;
  groupName: string;
};
