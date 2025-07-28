import type { Input } from 'src/types';

export function clearInput(input: Input): void {
  if (input instanceof HTMLInputElement) {
    input.value = '';
  } else if (input instanceof HTMLSelectElement) {
    input.selectedIndex = 0;
  }
}
