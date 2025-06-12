import { queryElements } from '$utils/queryelements';

import { attr } from './constants';
import { HandleQuestionItem } from './handleQuestionItem';
import type { Customer } from './types';

export class HandleQuestionGroup {
  private component: HTMLDivElement;
  private id: string;
  private for?: Customer;
  private questions: HandleQuestionItem[] = [];

  constructor(component: HTMLDivElement) {
    this.component = component;
    this.id = this.component.getAttribute(attr.questions.group) as string;
    this.for = this.component.getAttribute(attr.questions.groupFor) as Customer | undefined;
    this.questions = queryElements<HTMLDivElement>(`[${attr.questions.item}]`, this.component).map(
      (question) => new HandleQuestionItem(question)
    );

    this.init();
  }

  private init() {
    console.log(this);
  }
}
