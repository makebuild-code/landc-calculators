import { ENDPOINTS } from 'src/mct/shared/constants';
import { fetchData } from '$mct/utils';
import type { Lender, LenderListResponse } from '$mct/types';

/**
 * Fetches the lender list from the API.
 * @returns Promise<Lender[]>
 */
export const fetchLenders = async (): Promise<Lender[]> => {
  const data = await fetchData<LenderListResponse>(ENDPOINTS.lenders);
  return data.result.lenders;
};
