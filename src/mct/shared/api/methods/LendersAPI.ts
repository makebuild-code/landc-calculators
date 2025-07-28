import { APIClient } from '../client/APIClient';
import { API_CONFIG } from '$mct/config';
import type { LenderDetails, LenderListResponse } from '$mct/types';

export class LendersAPI {
  constructor(private client: APIClient) {}

  async getAll(): Promise<LenderDetails[]> {
    const response = await this.client.request<LenderListResponse>(API_CONFIG.endpoints.lenders);
    return response.result.lenders;
  }
}
