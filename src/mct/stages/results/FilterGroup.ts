import { InputGroupBase, type InputGroupOptions } from 'src/mct/shared/classes/InputGroupBase';

type FilterOptions = {} & InputGroupOptions;

export class FilterGroup extends InputGroupBase {
  constructor(el: HTMLElement, options: FilterOptions) {
    super(el, options);
  }

  protected init(): void {}
}
