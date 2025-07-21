export interface BaseResponse<T = Record<string, unknown>> {
  body: string;
  result: T;
  url: string;
}

export type LCID = string;
export type ICID = string | 'default';
export type LenderName = string;
export type LenderNames = LenderName[];

// @todo
export enum DatePlanToRemoENUM {
  WithinThreeMonths = '0-3 months',
  ThreeToSixMonths = '3-6 months',
  SixToTwelveMonths = '6-12 months',
  TwelvePlusMonths = 'Over 12 months',
}

export enum RemoChangeENUM {
  NoChange = 1,
  BorrowMore = 2,
  BorrowLess = 3,
  TermAndOrRepaymentType = 4,
}
