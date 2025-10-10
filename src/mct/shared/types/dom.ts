/**
 * DOM-related types for MCT module
 *
 * Contains types related to DOM elements, input handling,
 * and UI interactions.
 */

// Input element types
export type Input = HTMLInputElement | HTMLSelectElement;
export type InputType = 'radio' | 'checkbox' | 'text' | 'number' | 'select-one';
export type SelectOption = {
  value?: string;
  label: string;
  dataset?: {
    [key: string]: string;
  };
};

// Input value types at the point of retrieval
export type RadioValue = string;
export type CheckboxValues = boolean | string[];
export type TextValue = string;
export type NumberValue = number;
export type SelectValue = string;
// export type InputValue = RadioValue | CheckboxValues | TextValue | NumberValue | SelectValue;
