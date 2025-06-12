import type { Input } from 'src/types';

import { queryElements } from '$utils/queryelements';

import { attr } from './constants';

export class HandleQuestionItem {
  private component: HTMLDivElement;
  private id: string;
  private inputs: Input[];
  private value: string | null = null;
  private condition?: {
    dependsOn: string;
    value: string;
  };

  constructor(component: HTMLDivElement) {
    this.component = component;
    this.id = this.component.getAttribute(attr.questions.item) as string;
    this.inputs = queryElements('input, select, textarea', this.component) as Input[];

    const dependsOn = this.component.getAttribute(attr.questions.dependsOn);
    const value = this.component.getAttribute(attr.questions.dependsOnValue);

    this.condition = dependsOn && value ? { dependsOn, value } : undefined;

    this.init();
  }

  private init() {
    console.log(this);
  }
}
