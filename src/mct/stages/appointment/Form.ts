import { StatefulInputGroup, type StatefulInputGroupOptions } from '$mct/components';

export interface InputGroupOptions extends StatefulInputGroupOptions {}

export class InputGroup extends StatefulInputGroup {
  constructor(options: InputGroupOptions) {
    super(options);
  }

  protected onInit(): void {}
}
