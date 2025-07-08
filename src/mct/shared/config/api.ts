import { getBaseURLForAPI } from '$utils/environment/getBaseURLForAPI';
import type { CONFIG_API } from '$mct/types';

export const API_CONFIG: CONFIG_API = {
  baseURL: getBaseURLForAPI(),
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  endpoints: {
    lcid: 'EnquiryHttpTrigger',
    products: 'ProductsMCTHttpTrigger',
    lenders: 'LendersHttpTrigger',
    mortgageAppointmentSlots: 'GetMortgageAppointmentSlotsTrigger',
    createLeadAndBooking: 'CreateLeadAndBookingHttpTrigger',
    logUserEvents: 'LogEventHttpTrigger',
  },
} as const;
