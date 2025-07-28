/**
 * Remove event listener with error handling
 */
export const removeEventListenerSafe = (
  element: HTMLElement | null,
  event: string,
  handler: EventListener,
  options?: EventListenerOptions
): void => {
  if (!element) {
    console.warn(`Cannot remove event listener from null element: ${event}`);
    return;
  }

  element.removeEventListener(event, handler, options);
};
