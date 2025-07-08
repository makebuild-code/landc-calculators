export interface LenderDetails {
  MasterLenderId: number;
  ResidentialLenderId: number;
  BTLLenderId: number;
  LenderName: string;
  LenderImageURL: string | null;
  LenderKey: string | null;
}

export interface LenderListResult {
  lenders: LenderDetails[];
}

export interface LenderListResponse {
  result: LenderListResult;
}
