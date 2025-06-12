import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { attr, classes } from './constants';
import { HandleQuestionGroup } from './handleQuestionGroup';
import type { Customer } from './types';

export class HandleQuestions {
  component: HTMLDivElement;
  private scroll: HTMLDivElement;
  private wrapper: HTMLDivElement;
  private groups: HandleQuestionGroup[] = [];
  // private currentGroup: HTMLDivElement;
  private currentGroupIndex: number = 0;
  private currentItemsIndex: number = 0;
  private totalItems: number = 0;
  private items: HTMLDivElement[] = [];
  private itemsCount: number = 0;
  private firstItem: HTMLDivElement;
  private lastItem: HTMLDivElement;
  private nextButton: HTMLButtonElement;
  private prevButton: HTMLButtonElement;
  private customerType: Customer | null = null;

  constructor(component: HTMLDivElement) {
    this.component = component;
    this.scroll = queryElement(
      `[${attr.questions.components}="scroll"]`,
      this.component
    ) as HTMLDivElement;
    this.wrapper = queryElement(
      `[${attr.questions.components}="wrapper"]`,
      this.scroll
    ) as HTMLDivElement;
    this.groups = queryElements<HTMLDivElement>(`[${attr.questions.group}]`, this.component).map(
      (group) => new HandleQuestionGroup(group)
    );
    this.items = queryElements<HTMLDivElement>(
      `[${attr.questions.components}="item"]`,
      this.wrapper
    );
    this.itemsCount = this.items.length;
    [this.firstItem] = this.items;
    this.lastItem = this.items[this.itemsCount - 1];
    this.nextButton = queryElement(
      `[${attr.questions.components}="next"]`,
      this.component
    ) as HTMLButtonElement;
    this.prevButton = queryElement(
      `[${attr.questions.components}="previous"]`,
      this.component
    ) as HTMLButtonElement;

    this.init();
  }

  private init() {
    console.log(this);

    this.prepareWrapper();
    this.handleButtons();
    this.bindEvents();
    this.handleCurrentItem();
  }

  private prepareWrapper() {
    this.wrapper.style.paddingTop =
      this.scroll.offsetHeight / 2 - this.firstItem.offsetHeight / 2 + 'px';
    this.wrapper.style.paddingBottom =
      this.scroll.offsetHeight / 2 - this.lastItem.offsetHeight / 2 + 'px';
  }

  private goToItem(index: number) {
    if (index < 0 || index >= this.itemsCount) return;

    const item = this.items[index];
    this.items[this.currentItemsIndex].classList.remove(classes.active);
    item.classList.add(classes.active);

    this.scroll.scrollTo({
      top: item.offsetTop - this.scroll.offsetHeight / 2 + item.offsetHeight / 2,
      behavior: 'smooth',
    });

    this.currentItemsIndex = index;
    this.handleButtons();
    this.handleCurrentItem();
  }

  private bindEvents() {
    this.nextButton.addEventListener('click', () => {
      this.goToItem(this.currentItemsIndex + 1);
    });

    this.prevButton.addEventListener('click', () => {
      this.goToItem(this.currentItemsIndex - 1);
    });
  }

  private handleButtons() {
    this.nextButton.disabled = this.currentItemsIndex >= this.itemsCount - 1;
    this.prevButton.disabled = this.currentItemsIndex <= 0;
  }

  private handleCurrentItem() {
    const item = this.items[this.currentItemsIndex];
    const inputs = queryElements<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea',
      item
    );

    // Enable the next button if any input is filled or checked
    this.nextButton.disabled = !inputs.some((input) => {
      if (
        (input instanceof HTMLInputElement && input.type === 'checkbox') ||
        input.type === 'radio'
      )
        return input.checked;
      return input.value.trim() !== '';
    });

    // Add change event listeners to inputs to enable the next button
    inputs.forEach((input) => {
      input.addEventListener('change', () => {
        this.nextButton.disabled = false;
      });
    });
  }
}
