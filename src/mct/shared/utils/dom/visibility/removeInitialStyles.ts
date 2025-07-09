import { DOM_CONFIG } from '$mct/config';
import { queryElements } from '$utils/dom';

export const removeInitialStyles = (component: HTMLElement): void => {
  const elements = queryElements(`[${DOM_CONFIG.attributes.initial}]`, component);
  console.log('🔄 Removing initial styles', elements);
  elements.forEach((element) => {
    element.removeAttribute(DOM_CONFIG.attributes.initial);
  });
};
