import { StatefulInputGroup, type StatefulInputGroupOptions, type StatefulInputGroupState } from '$mct/components';

interface NewFilterOptions extends StatefulInputGroupOptions<NewFilterState> {}

interface NewFilterState extends StatefulInputGroupState {}

export class NewFilterComponent extends StatefulInputGroup<NewFilterState> {
  constructor(options: NewFilterOptions) {
    super(options);
  }
}
