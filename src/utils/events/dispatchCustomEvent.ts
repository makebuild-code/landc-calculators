/**
 * Dispatch a custom event with consistent options
 */

export const dispatchCustomEvent = (component: HTMLElement | null, eventName: string, detail?: any): void => {
  if (!component) {
    console.warn(`Cannot dispatch custom event to null component: ${eventName}`);
    return;
  }

  component.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: false }));
};
