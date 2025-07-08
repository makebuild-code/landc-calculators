import { APIClient } from '../client/APIClient';
import { ENDPOINTS } from '$mct/config';
import type { CreateLeadAndBookingRequest, CreateLeadAndBookingResponse } from '$mct/types';

export class CreateLeadAndBookingAPI {
  constructor(private client: APIClient) {}

  async createLeadAndBooking(request: CreateLeadAndBookingRequest): Promise<CreateLeadAndBookingResponse> {
    return this.client.request<CreateLeadAndBookingResponse>(ENDPOINTS.createLeadAndBooking, {
      method: 'POST',
      body: JSON.stringify({ input: request }),
    });
  }
}
