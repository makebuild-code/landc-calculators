import { SapValueENUM, type CONFIG_FILTERS } from '$mct/types';
import { getEnumKey } from '../utils/common/getEnumKey';

export const FILTERS_CONFIG: CONFIG_FILTERS = {
  NewBuild: 'false',
  SapValue: getEnumKey(SapValueENUM, SapValueENUM.No),
  ShowSharedOwnership: false,
};
