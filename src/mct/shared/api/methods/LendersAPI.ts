import { APIClient } from '../client/APIClient';
import { API_CONFIG } from '$mct/config';
import type { LenderDetails, LenderListResponse } from '$mct/types';

export class LendersAPI {
  private lenders: LenderDetails[] = [];

  constructor(private client: APIClient) {}

  async getAll(): Promise<LenderDetails[]> {
    const response = await this.client.request<LenderListResponse>(API_CONFIG.endpoints.lenders);
    this.lenders = response.result.lenders;
    return response.result.lenders;
  }

  async getFilteredAndSorted(): Promise<LenderDetails[]> {
    if (this.lenders.length === 0) await this.getAll();
    const response = this.lenders
      .filter((lender) => lender.LenderName !== '' && lender.LenderName !== null)
      .sort((a, b) => a.LenderName.localeCompare(b.LenderName));
    return response;
  }
}
