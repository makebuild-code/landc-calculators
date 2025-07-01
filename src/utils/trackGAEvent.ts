// Extend the Window interface to include gtag and ga
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    ga?: (...args: any[]) => void;
  }
}

/**
 * Fires a Google Analytics event (GA4 or Universal Analytics).
 *
 * @param eventName - The name of the event (e.g., 'button_click')
 * @param params - Additional event parameters (object)
 *
 * Usage:
 *   fireGAEvent('my_event', { category: 'form', label: 'submit', value: 1 });
 */
export function trackGAEvent(eventName: string, params: Record<string, any> = {}): void {
  // GA4 (gtag.js)
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
    return;
  }

  // Universal Analytics (analytics.js)
  if (typeof window !== 'undefined' && typeof window.ga === 'function') {
    window.ga('send', 'event', params.category || '', eventName, params.label, params.value);
    return;
  }

  // No GA available
  if (process.env.NODE_ENV === 'development') console.log('[GA] Event:', eventName, params);
}
