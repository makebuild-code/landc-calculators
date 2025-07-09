import { APIClient } from '../client/APIClient';
import { API_CONFIG } from '$mct/config';
import type { CreateLeadAndBookingRequest, CreateLeadAndBookingResponse } from '$mct/types';

export class CreateLeadAndBookingAPI {
  constructor(private client: APIClient) {}

  async createLeadAndBooking(request: CreateLeadAndBookingRequest): Promise<CreateLeadAndBookingResponse> {
    const input = { input: request };
    console.log('CreateLeadAndBooking Request: ', input);
    console.log('CreateLeadAndBooking Endpoint: ', API_CONFIG.endpoints.createLeadAndBooking);
    return this.client.request<CreateLeadAndBookingResponse>(API_CONFIG.endpoints.createLeadAndBooking, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}
