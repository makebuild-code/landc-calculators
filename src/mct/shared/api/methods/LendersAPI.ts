import { APIClient } from '../client/APIClient';
import { ENDPOINTS } from '../../constants';
import type { Lender, LenderListResponse } from '$mct/types';

export class LendersAPI {
  constructor(private client: APIClient) {}

  async getAll(): Promise<Lender[]> {
    const response = await this.client.request<LenderListResponse>(ENDPOINTS.lenders);
    return response.result.lenders;
  }
}
