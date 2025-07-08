import { APIClient } from '../client/APIClient';
import { ENDPOINTS } from '$mct/config';
import type { ICID, LCID } from '$mct/types';

export class LCIDAPI {
  constructor(private client: APIClient) {}

  async generate(lcid: LCID | null, icid: ICID | null): Promise<LCID> {
    const response = await this.client.request<{ result: { lcid: LCID } }>(ENDPOINTS.lcid, {
      method: 'POST',
      body: JSON.stringify({
        endpoint: 'NewEnquiry',
        input: { lcid, icid },
      }),
    });

    if (!response?.result?.lcid) throw new Error('Failed to generate LCID');
    return response.result.lcid;
  }
}
