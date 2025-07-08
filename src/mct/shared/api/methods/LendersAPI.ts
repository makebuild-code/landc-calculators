import { APIClient } from '../client/APIClient';
import { ENDPOINTS } from '$mct/config';
import type { LenderDetails, LenderListResponse } from '$mct/types';

export class LendersAPI {
  constructor(private client: APIClient) {}

  async getAll(): Promise<LenderDetails[]> {
    const response = await this.client.request<LenderListResponse>(ENDPOINTS.lenders);
    return response.result.lenders;
  }
}
