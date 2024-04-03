import type { Input } from 'src/types';

export function checkInputValidity(input: Input): { isValid: boolean; error: string | undefined } {
  let isValid = true,
    error: string | undefined;

  if (input instanceof HTMLInputElement) {
    const { type } = input;
    switch (type) {
      case 'text':
        isValid = input.checkValidity();
        error = input.validationMessage;
      case 'number':
        const { min, max, value } = input;

        let minValid = true;
        if (!!min) minValid = Number(value) >= Number(min);

        let maxValid = true;
        if (!!max) maxValid = Number(value) <= Number(max);

        isValid = minValid && maxValid;
        if (isValid) break;

        if (!minValid) {
          error = `Input needs to be greater than ${min}`;
        } else if (!maxValid) {
          error = `Input needs to be smaller than ${max}`;
        }
    }
  } else if (input instanceof HTMLSelectElement) {
    isValid = input.checkValidity();
    error = input.validationMessage;
  }

  return {
    isValid,
    error,
  };
}
