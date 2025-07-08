// Create the main API instance
import { APIClient } from './client';
import {
  LendersAPI,
  ProductsAPI,
  LCIDAPI,
  MortgageAppointmentSlotsAPI,
  CreateLeadAndBookingAPI,
  LogUserEventsAPI,
} from './methods';

// Create a single API client instance
const apiClient = new APIClient();

// Export typed API methods
export const createLeadAndBookingAPI = new CreateLeadAndBookingAPI(apiClient);
export const lcidAPI = new LCIDAPI(apiClient);
export const lendersAPI = new LendersAPI(apiClient);
export const logUserEventsAPI = new LogUserEventsAPI(apiClient);
export const mortgageAppointmentSlotsAPI = new MortgageAppointmentSlotsAPI(apiClient);
export const productsAPI = new ProductsAPI(apiClient);

// Export the client for advanced usage
export { apiClient };

// Re-export types and error handler
export { APIError, APIErrorHandler } from './client';
