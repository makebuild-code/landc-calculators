import { BuyerTypeENUM } from '$mct/types';
import { type LCID, type ICID, type LenderName, DatePlanToRemoENUM } from './base';

export type PartnerId = number | 'default';
export type Source = string;
export type SourceID = number;

export enum FirstTimeBuyerENUM {
  Yes = 'Y',
  No = 'N',
}

export enum RepaymentTypeENUM {
  Repayment = 'Repayment',
  InterestOnly = 'Interest Only',
  Both = 'Both',
}

export enum ResiBtlENUM {
  Residential = 'R',
  Btl = 'B',
}

export enum OfferAcceptedENUM {
  Yes = 'Y',
  No = 'N',
}

export enum ReadinessToBuyENUM {
  Researching = 'R',
  Viewing = 'V',
  MadeAnOffer = 'M',
  OfferAccepted = 'A',
}

export enum PurchRemoENUM {
  Purchase = 'P',
  Remortgage = 'R',
}

export enum CreditImpairedENUM {
  Yes = 'Y',
  No = 'N',
}

export enum FTBENUM {
  Yes = 'Y',
  No = 'N',
}

export enum NewBuildENUM {
  Yes = 'Y',
  No = 'N',
}

export interface EnquiryForm {
  FirstName: string;
  Surname: string;
  Email: string;
  Mobile: string;
  Vulnerable: 'Yes' | 'No';
  VulnerableMessage: string;
  IsEmailMarketingPermitted: boolean;
  IsPhoneMarketingPermitted: boolean;
  IsSMSMarketingPermitted: boolean;
  IsPostMarketingPermitted: boolean;
  IsSocialMessageMarketingPermitted: boolean;
}

export interface EnquiryMinimum {
  lcid: LCID;
  icid: ICID;
  ResiBtl: ResiBtlENUM;
  PropertyValue: number;
  RepaymentType: RepaymentTypeENUM;
  MortgageLength: number;
  LoanAmount: number;
  Notes?: string;
}

export interface EnquiryBase extends EnquiryMinimum {
  BuyerType: BuyerTypeENUM;
  PurchRemo: PurchRemoENUM;
  LTV: number;
  CreditImpaired: CreditImpairedENUM;
  InterestOnlyAmount: number;
  ChosenMCTProduct?: string;
  // PartnerId?: PartnerId;
  // Source?: Source;
  // SourceId?: SourceID;
}

export interface EnquiryPurchase extends EnquiryBase {
  PurchasePrice: number;
  OfferAccepted: OfferAcceptedENUM;
  ReadinessToBuy: ReadinessToBuyENUM;
  DepositAmount: number;
  FTB: FTBENUM;
  NewBuild: NewBuildENUM;
}

export interface EnquiryRemortgage extends EnquiryBase {
  DatePlanToRemo: DatePlanToRemoENUM;
  // Lender?: LenderName;
  CurrentLender: LenderName;
}

// Union type that can be either purchase or remortgage enquiry
export type EnquiryData = EnquiryPurchase | EnquiryRemortgage;

// Helper type to extract the correct enquiry type based on PurchRemo
export type EnquiryDataForPurchRemo<T extends PurchRemoENUM> = T extends PurchRemoENUM.Purchase
  ? EnquiryPurchase
  : T extends PurchRemoENUM.Remortgage
    ? EnquiryRemortgage
    : never;

// Utility type to get the correct enquiry type when you have an object with PurchRemo
export type EnquiryDataFromObject<T extends { PurchRemo?: PurchRemoENUM }> =
  T['PurchRemo'] extends PurchRemoENUM.Purchase
    ? EnquiryPurchase
    : T['PurchRemo'] extends PurchRemoENUM.Remortgage
      ? EnquiryRemortgage
      : EnquiryData; // fallback to union type if PurchRemo is undefined

// Basic union type for general use
export type EnquiryLead = Omit<EnquiryForm, 'Vulnerable' | 'VulnerableMessage'> & EnquiryData;

// Type-safe version when you know the PurchRemo value
export type EnquiryLeadForPurchRemo<T extends PurchRemoENUM> = Omit<EnquiryForm, 'Vulnerable' | 'VulnerableMessage'> &
  EnquiryDataForPurchRemo<T>;

export interface Booking {
  source: 'SYSTEM';
  bookingDate: string; // ISO 8601 format e.g. "2025-05-12T15:15:58.163Z"
  bookingStart: string;
  bookingEnd: string;
  bookingProfile: 'DEFAULT';
  bookingProfileId: number;
}

export interface CreateLeadAndBookingRequest {
  enquiry: EnquiryMinimum | EnquiryLead;
  booking: Booking;
}

export interface CreateLeadAndBookingResponse {
  url: string;
  body: string;
  result: string;
  error?: string;
}

/*
 * Usage Examples:
 *
 * // When you know the PurchRemo value at compile time:
 * type PurchaseEnquiry = EnquiryDataForPurchRemo<PurchRemoENUM.Purchase>; // EnquiryPurchase
 * type RemortgageEnquiry = EnquiryDataForPurchRemo<PurchRemoENUM.Remortgage>; // EnquiryRemortgage
 *
 * // When you have an object with PurchRemo and want type safety:
 * const data: { PurchRemo: PurchRemoENUM.Purchase } = { PurchRemo: PurchRemoENUM.Purchase };
 * type TypedEnquiry = EnquiryDataFromObject<typeof data>; // EnquiryPurchase
 *
 * // For the lead with form data:
 * type PurchaseLead = EnquiryLeadForPurchRemo<PurchRemoENUM.Purchase>; // EnquiryForm + EnquiryPurchase
 * type RemortgageLead = EnquiryLeadForPurchRemo<PurchRemoENUM.Remortgage>; // EnquiryForm + EnquiryRemortgage
 */
