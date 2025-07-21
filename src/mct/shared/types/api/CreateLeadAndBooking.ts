import { BuyerTypeENUM, MortgageTypeENUM } from '$mct/types';
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

export interface EnquiryForm {
  FirstName: string;
  Surname: string;
  Email: string;
  Mobile: string;
  Vulnerable: boolean;
  VulnerableMessage: string;
  IsEmailMarketingPermitted: boolean;
  IsPhoneMarketingPermitted: boolean;
  IsSMSMarketingPermitted: boolean;
  IsPostMarketingPermitted: boolean;
  IsSocialMessageMarketingPermitted: boolean;
}

export interface EnquiryData {
  lcid: LCID;
  icid: ICID;
  // PartnerId?: PartnerId;
  PurchasePrice: number;
  RepaymentType: RepaymentTypeENUM;
  OfferAccepted?: OfferAcceptedENUM;
  MortgageLength: number;
  MaximumBudget?: number;
  BuyerType?: BuyerTypeENUM;
  ResiBtl: ResiBtlENUM;
  Lender?: LenderName;
  ReadinessToBuy?: ReadinessToBuyENUM;
  PurchRemo?: PurchRemoENUM;
  PropertyValue: number;
  DepositAmount: number;
  LTV?: number;
  // Source?: Source;
  // SourceId?: SourceID;
  CreditImpaired?: CreditImpairedENUM;
  // NEW
  // MortgageType: MortgageTypeENUM;
  CurrentLender?: string;
  LoanAmount: number;
  InterestOnlyAmount: number;
  Notes?: string;
  FTB: boolean;
  NewBuild: boolean;
  DatePlanToRemo?: DatePlanToRemoENUM;
  ChosenMCTProduct: number;
}

export type EnquiryLead = Omit<EnquiryForm, 'Vulnerable' | 'VulnerableMessage'> & EnquiryData;

export interface Booking {
  source: 'SYSTEM';
  bookingDate: string; // ISO 8601 format e.g. "2025-05-12T15:15:58.163Z"
  bookingStart: string;
  bookingEnd: string;
  bookingProfile: 'DEFAULT';
  bookingProfileId: number;
}

export interface CreateLeadAndBookingRequest {
  enquiry: EnquiryLead;
  booking: Booking;
}

export interface CreateLeadAndBookingResponse {
  url: string;
  body: string;
  result: string;
  error?: string;
}
