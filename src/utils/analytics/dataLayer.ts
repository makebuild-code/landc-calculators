// Extend the Window interface to include dataLayer
declare global {
  interface Window {
    dataLayer?: any[];
  }
}

export interface DataLayerParams {
  event_category?: string;
  event_label?: string;
  event_value?: string;
  [key: string]: any;
}

export type DataLayerEvent = 'form_interaction';

/**
 * Fires a Google Analytics event (GA4 or Universal Analytics).
 *
 * @param event - The type of the event (e.g., 'form_interaction')
 * @param params - Additional event parameters (should include event_category, event_label, event_value, etc.)
 *
 * Usage:
 *   dataLayer('form_interaction', { event_category: 'MCTForm', event_label: 'MCT_Submit_${name}', event_value: '${value}' });
 */
export function dataLayer(event: DataLayerEvent, params: DataLayerParams = {}): void {
  console.log('PUSHING TO DATA LAYER', { event, ...params });

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...params,
  });
}
