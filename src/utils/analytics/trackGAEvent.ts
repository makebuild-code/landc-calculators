// Extend the Window interface to include gtag and ga
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    ga?: (...args: any[]) => void;
  }
}

export interface TrackGAEventParams {
  event_category?: string;
  event_label?: string;
  [key: string]: any;
}

/**
 * Fires a Google Analytics event (GA4 or Universal Analytics).
 *
 * @param eventType - The type of the event (e.g., 'form_interaction', 'button_click')
 * @param params - Additional event parameters (should include event_category, event_label, etc.)
 *
 * Usage:
 *   trackGAEvent('form_interaction', { event_category: 'form', event_label: 'submit', value: 1 });
 */
export function dataLayer(eventType: string, params: TrackGAEventParams = {}): void {
  // GA4 (gtag.js)
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventType, params);
    return;
  }

  // Universal Analytics (analytics.js)
  if (typeof window !== 'undefined' && typeof window.ga === 'function') {
    window.ga(
      'send',
      'event',
      params.event_category || '',
      eventType, // action
      params.event_label,
      params.value
    );
    return;
  }

  // No GA available
  if (process.env.NODE_ENV === 'development') console.log('[GA] Event:', eventType, params);
}
