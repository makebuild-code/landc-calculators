import { logError } from '$mct/utils';
import { debugWarn } from '$utils/debug';
import { APIError } from './APIClient';

export class APIErrorHandler {
  static handle(error: unknown, context: string): void {
    if (error instanceof APIError) {
      this.handleAPIError(error, context);
    } else {
      this.handleGenericError(error, context);
    }
  }

  private static handleAPIError(error: APIError, context: string): void {
    // Enhanced logging with structured data
    logError(`API Error in ${context}`, {
      data: {
        endpoint: error.endpoint,
        status: error.status,
        message: error.message,
        response: error.response,
      },
    });

    // Show user-friendly message based on error type
    this.showUserFriendlyMessage(error);
  }

  private static handleGenericError(error: unknown, context: string): void {
    logError(`Generic error in ${context}`, {
      data: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }

  private static showUserFriendlyMessage(error: APIError): void {
    let message = 'An error occurred while fetching data.';

    switch (error.status) {
      case 404:
        message = 'The requested data was not found.';
        break;
      case 429:
        message = 'Too many requests. Please try again in a moment.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      case 408:
        message = 'Request timed out. Please check your connection and try again.';
        break;
    }

    // You could integrate this with a toast notification system
    debugWarn('User message:', message);
  }
}
