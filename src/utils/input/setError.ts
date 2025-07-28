import type { Input } from 'src/types';

import { getWrapper } from '../dom/getWrapper';
import { queryElement } from '../dom/queryElement';

export function setError(input: Input, text?: string): void {
  const wrapper = getWrapper(input);

  if (!wrapper) return;

  const message = queryElement('[data-calc-el="message"]', wrapper);
  const error = queryElement('[data-calc-el="error"]', wrapper);

  if (!error) return;

  if (text) {
    error.textContent = text;
    error.style.display = 'block';
    if (message) message.style.display = 'none';
  } else {
    error.style.display = 'none';
    if (message) message.style.removeProperty('display');
  }
}
