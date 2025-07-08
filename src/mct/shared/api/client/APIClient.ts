import { getBaseURLForAPI } from '$utils/environment/getBaseURLForAPI';
import { logError } from '$mct/utils';

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

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public response?: any
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
    this.baseURL = config.baseURL || getBaseURLForAPI();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...options.headers };

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await this.makeRequest<T>(url, requestOptions);
        return response;
      } catch (error) {
        lastError = error as Error;

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
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }

        throw new APIError(`HTTP ${response.status}: ${response.statusText}`, response.status, url, errorData);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError('Request timeout', 408, url);
      }

      throw new APIError(error instanceof Error ? error.message : 'Network error', 0, url);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
