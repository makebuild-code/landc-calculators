import type { Input } from 'src/types';

export function formatInput(input: Input): void {
  if (input instanceof HTMLInputElement) {
    const { type, value } = input;
    if (type !== 'number') return;

    console.log('input:');
    console.log(input);

    const { step } = input;
    console.log(step);

    if (Number(step) < 1) return;

    input.value = Math.round(Number(value)).toString();
  }
}
