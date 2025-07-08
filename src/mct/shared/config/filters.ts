import { SapValueENUM } from '$mct/types';
import { getEnumKey } from '../utils/common/getEnumKey';

export const FILTERS_CONFIG = {
  NewBuild: 'false',
  SapValue: getEnumKey(SapValueENUM, SapValueENUM.No),
};
