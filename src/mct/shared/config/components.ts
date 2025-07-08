import type { CONFIG_COMPONENTS } from '$mct/types';

export const COMPONENTS_CONFIG: CONFIG_COMPONENTS = {
  slider: {
    numberOfDaysPerView: { desktop: 7, tablet: 5, landscape: 4, portrait: 3 },
    numberOfDaysPerMove: { desktop: 7, tablet: 5, landscape: 4, portrait: 3 },
  },
} as const;
