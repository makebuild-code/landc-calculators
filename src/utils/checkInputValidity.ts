import type { Input } from 'src/types';

export function checkInputValidity(input: Input): { isValid: boolean; error: string | undefined } {
  let isValid = true,
    error: string | undefined;

  if (input instanceof HTMLInputElement) {
    const { type, required, value } = input;

    // Check for required input explicitly
    if (required && !value.trim()) {
      isValid = false;
      error = 'This field is required.';
      return { isValid, error };
    }

    switch (type) {
      case 'number':
        const { min, max } = input;
        let minValid = true;
        if (!!min) minValid = Number(value) >= Number(min);

        let maxValid = true;
        if (!!max) maxValid = Number(value) <= Number(max);

        isValid = minValid && maxValid;
        if (isValid) break;

        error = !minValid ? `Input needs to be ${min} or higher` : `Input needs to be ${max} or less`;
        break;
      default:
        isValid = input.checkValidity();
        error = isValid ? undefined : input.validationMessage;
        break;
    }
  } else if (input instanceof HTMLSelectElement) {
    isValid = input.checkValidity();
    error = isValid ? undefined : input.validationMessage;
  }

  return {
    isValid,
    error,
  };
}
