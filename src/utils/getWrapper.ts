import type { Input } from 'src/types';

export function getWrapper(input: Input): HTMLElement | undefined {
  let child = input as HTMLElement,
    wrapper: HTMLElement | undefined;

  while (child) {
    if (
      child.parentElement &&
      child.parentElement.classList &&
      child.parentElement.classList.contains('custom-field_component')
    ) {
      wrapper = child.parentElement;
      break;
    } else if (child.parentElement) {
      child = child.parentElement;
    } else {
      break;
    }
  }

  return wrapper;
}
