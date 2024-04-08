import type { Input } from 'src/types';

import { getInputValue } from './getInputValue';
import { queryElement } from './queryElement';

export function handleConditionalVisibility(item: HTMLElement, inputs: Input[]): void {
  const { condition } = item.dataset;
  if (!condition) return;

  const parsedCondition = JSON.parse(condition);

  const input = inputs.find((input) => input.dataset.input === parsedCondition.dependsOn);
  if (!input) return;

  let conditionsMet = false;

  switch (parsedCondition.operator) {
    case 'equal':
      conditionsMet = getInputValue(input) === parsedCondition.value;
      break;
    case 'notequal':
      conditionsMet = getInputValue(input) !== parsedCondition.value;
      break;
  }

  item.style.display = conditionsMet ? 'block' : 'none';
  const itemInput = queryElement('[data-input]', item) as Input;
  if (itemInput) {
    itemInput.dataset.conditionsmet = conditionsMet.toString();
  }
}
