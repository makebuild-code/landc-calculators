import { APIClient } from '../client/APIClient';
import { API_CONFIG } from '$mct/config';
import type { MortgageAppointmentSlotsResponse } from '$mct/types';

export class MortgageAppointmentSlotsAPI {
  constructor(private client: APIClient) {}

  async getSlots(dateFrom: string, dateTo: string): Promise<MortgageAppointmentSlotsResponse> {
    const params = new URLSearchParams({
      dateFrom,
      dateTo,
    });

    return this.client.request<MortgageAppointmentSlotsResponse>(
      `${API_CONFIG.endpoints.mortgageAppointmentSlots}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }
}
