import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';

/**
 * DOM Element Query Utilities
 *
 * Consolidates repeated patterns for querying DOM elements with data attributes.
 * This reduces code duplication and provides consistent error handling.
 */

/**
 * Get a single element by data attribute name and value
 */
export function getElementByAttr<T extends HTMLElement = HTMLElement>(
  attrName: string,
  value: string,
  parent?: HTMLElement
): T {
  const selector = `[${attrName}="${value}"]`;
  const element = queryElement(selector, parent) as T;
  if (!element) console.warn(`Element not found: ${selector}`);

  return element;
}

/**
 * Get a single element by data attribute name only
 */
export function getElementByAttrName<T extends HTMLElement = HTMLElement>(attrName: string, parent?: HTMLElement): T {
  const selector = `[${attrName}]`;
  const element = queryElement(selector, parent) as T;
  if (!element) console.warn(`Element not found: ${selector}`);

  return element;
}

/**
 * Get multiple elements by data attribute name
 */
export function getElementsByAttr<T extends HTMLElement = HTMLElement>(attrName: string, parent?: HTMLElement): T[] {
  const selector = `[${attrName}]`;
  const elements = queryElements(selector, parent) as T[];
  if (elements.length === 0) console.warn(`No elements found: ${selector}`);

  return elements;
}

/**
 * Get a component element by attribute name and value (common pattern in MCT)
 */
export function getComponentByAttr(attrName: string, value: string, parent?: HTMLElement): HTMLElement {
  return getElementByAttr(attrName, value, parent);
}

/**
 * Get a component element by attribute name only (common pattern in MCT)
 */
export function getComponentByAttrName(attrName: string, parent?: HTMLElement): HTMLElement {
  return getElementByAttrName(attrName, parent);
}

/**
 * Get component elements by attribute name (common pattern in MCT)
 */
export function getComponentsByAttr(attrName: string, parent?: HTMLElement): HTMLElement[] {
  return getElementsByAttr(attrName, parent);
}

/**
 * Get a button element by attribute name and value
 */
export function getButtonByAttr(attrName: string, value: string, parent?: HTMLElement): HTMLButtonElement {
  return getElementByAttr<HTMLButtonElement>(attrName, value, parent);
}

/**
 * Get a button element by attribute name only
 */
export function getButtonByAttrName(attrName: string, parent?: HTMLElement): HTMLButtonElement {
  return getElementByAttrName<HTMLButtonElement>(attrName, parent);
}

/**
 * Get a select element by attribute name and value
 */
export function getSelectByAttr(attrName: string, value: string, parent?: HTMLElement): HTMLSelectElement {
  return getElementByAttr<HTMLSelectElement>(attrName, value, parent);
}

/**
 * Get a select element by attribute name only
 */
export function getSelectByAttrName(attrName: string, parent?: HTMLElement): HTMLSelectElement {
  return getElementByAttrName<HTMLSelectElement>(attrName, parent);
}

/**
 * Get a dialog element by attribute name and value
 */
export function getDialogByAttr(attrName: string, value: string, parent?: HTMLElement): HTMLDialogElement {
  return getElementByAttr<HTMLDialogElement>(attrName, value, parent);
}

/**
 * Get a dialog element by attribute name only
 */
export function getDialogByAttrName(attrName: string, parent?: HTMLElement): HTMLDialogElement {
  return getElementByAttrName<HTMLDialogElement>(attrName, parent);
}

/**
 * Get a link element by attribute name and value
 */
export function getLinkByAttr(attrName: string, value: string, parent?: HTMLElement): HTMLLinkElement {
  return getElementByAttr<HTMLLinkElement>(attrName, value, parent);
}

/**
 * Get a link element by attribute name only
 */
export function getLinkByAttrName(attrName: string, parent?: HTMLElement): HTMLLinkElement {
  return getElementByAttrName<HTMLLinkElement>(attrName, parent);
}
