import { APIClient } from '../client/APIClient';
import { ENDPOINTS } from '$mct/config';
import type { LogUserEventRequest, LogUserEventResponse } from '$mct/types';

export class LogUserEventsAPI {
  constructor(private client: APIClient) {}

  async logEvent(request: LogUserEventRequest): Promise<LogUserEventResponse> {
    return this.client.request<LogUserEventResponse>(ENDPOINTS.logUserEvents, {
      method: 'POST',
      body: JSON.stringify({ input: request }),
    });
  }
}
