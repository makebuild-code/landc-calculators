import { StatefulInputGroup, type StatefulInputGroupConfig } from '$mct/components';

export interface InputGroupConfig extends StatefulInputGroupConfig {}

export class InputGroup extends StatefulInputGroup {
  constructor(config: InputGroupConfig) {
    // No custom state extensions needed for InputGroup
    super(config);
  }

  protected onInit(): void {}
}
