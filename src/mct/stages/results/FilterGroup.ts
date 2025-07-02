import { InputGroupBase } from 'src/mct/shared/classes/InputGroupBase';
import type { InputGroupOptions } from '$mct/types';

type FilterOptions = {} & InputGroupOptions;

export class FilterGroup extends InputGroupBase {
  constructor(el: HTMLElement, options: FilterOptions) {
    super(el, options);
  }

  protected init(): void {}
}
