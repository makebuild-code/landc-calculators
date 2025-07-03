// Create the main API instance
import { APIClient } from './client';
import { LendersAPI, ProductsAPI, LCIDAPI } from './methods';

// Create a single API client instance
const apiClient = new APIClient();

// Export typed API methods
export const lendersAPI = new LendersAPI(apiClient);
export const productsAPI = new ProductsAPI(apiClient);
export const lcidAPI = new LCIDAPI(apiClient);

// Export the client for advanced usage
export { apiClient };

// Re-export types and error handler
export { APIError, APIErrorHandler } from './client';
