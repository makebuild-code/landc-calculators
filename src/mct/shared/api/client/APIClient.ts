import { API_CONFIG } from '$mct/config';
import { debugError, debugLog } from '$utils/debug';
import { getBaseURLForAPI } from '$utils/environment/getBaseURLForAPI';
import { globalEventBus } from '../../components/events/globalEventBus';
import { APIEventNames } from '../../types/events';

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface APIClientConfig {
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface APIErrorResponse {
  title: string;
  status: number;
  detail: string;
}

export interface APIErrorItem {
  field?: string;
  message?: string;
  code?: string;
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public response?: any,
    public errorDetails?: APIErrorResponse
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  constructor(config: APIClientConfig = {}) {
    this.baseURL = config.baseURL || API_CONFIG.baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout || API_CONFIG.timeout;
    this.retries = config.retries || API_CONFIG.retries;
    this.retryDelay = config.retryDelay || API_CONFIG.retryDelay;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    debugLog('🔄 Request URL: ', url);
    debugLog('🔄 Request Options: ', options);
    const headers = { ...this.defaultHeaders, ...options.headers };

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    debugLog('🔄 Request Options: ', requestOptions);

    let lastError: Error | null = null;

    // Emit API request start event
    globalEventBus.emit(APIEventNames.REQUEST_START, {
      endpoint: url,
      method: requestOptions.method || 'GET',
    });

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await this.makeRequest<T>(url, requestOptions);

        // Emit API request success event
        globalEventBus.emit(APIEventNames.REQUEST_SUCCESS, {
          endpoint: url,
          method: requestOptions.method || 'GET',
          response,
        });

        return response;
      } catch (error) {
        lastError = error as Error;

        // Emit API request error event
        globalEventBus.emit(APIEventNames.REQUEST_ERROR, {
          endpoint: url,
          method: requestOptions.method || 'GET',
          error: lastError,
        });

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error instanceof APIError && error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === this.retries) {
          throw error;
        }

        // Wait before retrying
        await this.delay(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    throw lastError;
  }

  private async makeRequest<T>(url: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        let errorDetails: APIErrorResponse | undefined;

        try {
          errorData = await response.json();

          // Check if the response has the expected error structure
          if (errorData && typeof errorData === 'object' && errorData.error) {
            errorDetails = errorData.error as APIErrorResponse;

            // Log the complete error object for debugging
            debugError('❌ Complete API Error Object:', errorData);

            // Log the structured error details
            debugError('❌ API Error Response:', {
              title: errorDetails.title,
              status: errorDetails.status,
              detail: errorDetails.detail,
              url: url,
            });

            // Check for additional errors array
            if (errorData.errors && Array.isArray(errorData.errors)) {
              debugError('❌ API Validation Errors:', {
                count: errorData.errors.length,
                errors: errorData.errors.map((err: APIErrorItem) => ({
                  field: err.field || 'unknown',
                  message: err.message || 'No message',
                  code: err.code || 'unknown',
                })),
                url: url,
              });
            }
          } else {
            // Fallback for non-structured error responses
            debugError('❌ API Error Response:', {
              status: response.status,
              statusText: response.statusText,
              data: errorData,
              url: url,
            });
          }
        } catch {
          errorData = await response.text();
          debugError('❌ API Error Response (text):', {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
            url: url,
          });
        }

        const errorMessage = errorDetails
          ? `${errorDetails.title}: ${errorDetails.detail}`
          : `HTTP ${response.status}: ${response.statusText}`;

        throw new APIError(errorMessage, response.status, url, errorData, errorDetails);
      }

      // Log successful responses for debugging
      const responseData = await response.json();
      debugLog('✅ API Success Response:', {
        status: response.status,
        url: url,
        data: responseData,
      });

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        debugError('⏰ Request timeout:', { url });
        throw new APIError('Request timeout', 408, url);
      }

      debugError('🌐 Network error:', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new APIError(error instanceof Error ? error.message : 'Network error', 0, url);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
