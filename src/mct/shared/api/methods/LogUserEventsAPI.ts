import { APIClient } from '../client/APIClient';
import { API_CONFIG } from '$mct/config';
import type { LogUserEventRequest, LogUserEventResponse } from '$mct/types';

export class LogUserEventsAPI {
  constructor(private client: APIClient) {}

  async logEvent(request: LogUserEventRequest): Promise<LogUserEventResponse> {
    console.log('LogUserEventsAPI: ', request);
    return this.client.request<LogUserEventResponse>(API_CONFIG.endpoints.logUserEvents, {
      method: 'POST',
      body: JSON.stringify({ input: request }),
    });
  }
}
