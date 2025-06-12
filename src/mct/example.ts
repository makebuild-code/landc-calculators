import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr } from './constants';

type Customer =
  | 'resi-purchase'
  | 'ftb-resi-purchase'
  | 'resi-mortgage'
  | 'btl-remo'
  | 'btl-purchase';

type Input = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface Question {
  id: string;
  element: HTMLDivElement;
  inputs: Input[];
  value: string | null;
  condition?: {
    dependsOn: string;
    value: string;
  };
}

interface Group {
  id: string;
  element: HTMLDivElement;
  for?: Customer;
  questions: Question[];
}

const groups: Group[] = [
  {
    id: 'customer-identifier',
    element: queryElement(`[${attr.questions.group}="customer-identifier"]`) as HTMLDivElement,
    questions: [
      {
        id: 'master-identifier',
        element: queryElement(
          `[${attr.questions.components}="item"]`,
          this.group.element
        ) as HTMLDivElement,
        inputs: queryElements('input, select, textarea', this.element) as Input[],
        value: this.inputs.getValue(),
      },
    ],
  },
];
