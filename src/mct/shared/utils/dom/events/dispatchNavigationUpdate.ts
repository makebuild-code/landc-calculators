/**
 * Dispatch a navigation update event (common pattern in MCT)
 */

import { dispatchCustomEvent } from '$utils/events/dispatchCustomEvent';

export const dispatchNavigationUpdate = (
  component: HTMLElement,
  options: { nextEnabled?: boolean; prevEnabled?: boolean } = {}
): void => {
  dispatchCustomEvent(component, 'mct:navigation:update', options);
};
