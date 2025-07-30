import { StatefulInputGroup, type StatefulInputGroupConfig, type StatefulInputGroupState } from '$mct/components';

interface FilterConfig extends StatefulInputGroupConfig {}

interface FilterState extends StatefulInputGroupState {}

export class FilterComponent extends StatefulInputGroup<FilterState> {
  constructor(config: FilterConfig) {
    // No custom state extensions needed for FilterComponent
    super(config);
  }

  protected onInit(): void {}
}
