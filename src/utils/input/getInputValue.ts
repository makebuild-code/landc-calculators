import type { Input } from 'src/types';

import { queryElement } from '$utils/dom';

export function getInputValue(input: Input): string | boolean | undefined {
  let value;

  if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
    value = input.value;
  } else if (input instanceof HTMLFieldSetElement) {
    const checkedRadio = queryElement('input[type="radio"]:checked', input) as HTMLInputElement;
    value = checkedRadio.value;
  }

  if (input instanceof HTMLInputElement && input.type === 'checkbox') {
    value = input.checked;
  }

  if (value === 'true' || value === 'on' || value === 'Y') {
    value = true;
  } else if (value === 'false' || value === 'off' || value === 'N') {
    value = false;
  }

  return value;
}
