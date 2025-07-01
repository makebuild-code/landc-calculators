import { fetchData } from '../utils/fetchData';

// Types for the lender list response
export interface Lender {
  MasterLenderId: number;
  ResidentialLenderId: number;
  BTLLenderId: number;
  LenderName: string;
  LenderImageURL: string | null;
  LenderKey: string | null;
}

export interface LenderListResult {
  lenders: Lender[];
}

export interface LenderListResponse {
  result: LenderListResult;
}

/**
 * Fetches the lender list from the API.
 * @returns Promise<Lender[]>
 */
export const fetchLenders = async (): Promise<Lender[]> => {
  const data = await fetchData<LenderListResponse>('LendersHttpTrigger');
  return data.result.lenders;
};
