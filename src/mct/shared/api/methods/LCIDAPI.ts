import { APIClient } from '../client/APIClient';
import { ENDPOINTS } from '../../constants';

export class LCIDAPI {
  constructor(private client: APIClient) {}

  async generate(lcid: string | null, icid: string | null): Promise<string> {
    const response = await this.client.request<{ result: { lcid: string } }>(ENDPOINTS.lcid, {
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
