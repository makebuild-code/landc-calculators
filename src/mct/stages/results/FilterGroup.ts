import { StatefulInputGroup, type StatefulInputGroupOptions, type StatefulInputGroupState } from '$mct/components';

interface FilterOptions extends StatefulInputGroupOptions<FilterState> {}

interface FilterState extends StatefulInputGroupState {}

export class FilterComponent extends StatefulInputGroup<FilterState> {
  constructor(options: FilterOptions) {
    super(options);
  }

  protected onInit(): void {}
}
