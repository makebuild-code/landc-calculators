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
export enum EndOfTermENUM {
  WithinThreeMonths = '1',
  ThreeToSixMonths = '2',
  SixToTwelveMonths = '3',
  TwelvePlusMonths = '4',
}

export enum RemoChangeENUM {
  NoChange = 1,
  BorrowMore = 2,
  BorrowLess = 3,
  TermAndOrRepaymentType = 4,
}
