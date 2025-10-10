import { DOM_CONFIG } from '$mct/config';
import { queryElements } from '$utils/dom';

export const removeInitialStyles = (component: HTMLElement, delayMS: number = 0): void => {
  const elements = queryElements(`[${DOM_CONFIG.attributes.initial}]`, component);

  setTimeout(() => {
    elements.forEach((element) => {
      element.removeAttribute(DOM_CONFIG.attributes.initial);
    });
  }, delayMS);
};
