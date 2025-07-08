import { InputGroupBase } from '$mct/components';
import type { InputGroupOptions } from '$mct/types';

type FilterOptions = {} & InputGroupOptions;

export class FilterGroup extends InputGroupBase {
  constructor(el: HTMLElement, options: FilterOptions) {
    super(el, options);
  }

  protected init(): void {}
}
