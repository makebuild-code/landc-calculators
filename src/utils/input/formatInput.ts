import type { Input } from 'src/types';

import { queryElements } from '$utils/dom';

export function formatInput(input: Input): void {
  if (input instanceof HTMLInputElement) {
    const { type, value } = input;
    if (type !== 'number') return;

    const { step } = input;

    if (Number(step) < 1) return;

    input.value = Math.round(Number(value)).toString();
  } else if (input.type === 'fieldset') {
    const radios = queryElements('input[type="radio"]') as HTMLInputElement[];
    radios.forEach((radio) => {
      const { parentElement, checked } = radio;
      if (!parentElement) return;
      if (checked) {
        parentElement.classList.add('checked');
      } else {
        parentElement.classList.remove('checked');
      }
    });
  }
}
