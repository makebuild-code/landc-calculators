/**
 * Add event listener with error handling
 */

export const addEventListenerSafe = (
  element: HTMLElement | null,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): void => {
  if (!element) {
    console.warn(`Cannot add event listener to null element: ${event}`);
    return;
  }

  element.addEventListener(event, handler, options);
};
