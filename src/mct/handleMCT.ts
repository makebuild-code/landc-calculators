import { queryElement } from '$utils/queryElement';

import { attr } from './constants';
import { HandleQuestions } from './handleQuestions';

export class handleMCT {
  component: HTMLDivElement;
  private componentQuestions: HTMLDivElement;
  private componentOutput: HTMLDivElement;
  private componentResults: HTMLDivElement;
  private componentCalendar: HTMLDivElement;

  constructor(component: HTMLDivElement) {
    this.component = component;
    this.componentQuestions = queryElement(
      `[${attr.stage}="questions"]`,
      this.component
    ) as HTMLDivElement;
    this.componentOutput = queryElement(
      `[${attr.stage}="output"]`,
      this.component
    ) as HTMLDivElement;
    this.componentResults = queryElement(
      `[${attr.stage}="results"]`,
      this.component
    ) as HTMLDivElement;
    this.componentCalendar = queryElement(
      `[${attr.stage}="calendar"]`,
      this.component
    ) as HTMLDivElement;

    this.init();
  }

  private init() {
    console.log(this);

    if (this.componentQuestions) this.initQuestions();
  }

  private initQuestions() {
    const questions = new HandleQuestions(this.componentQuestions);
  }
}
