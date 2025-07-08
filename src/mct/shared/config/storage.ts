import type { StorageConfig } from '$mct/state';
import type { AppState, CONFIG_STORAGE } from '$mct/types';

export const STORAGE_CONFIG: CONFIG_STORAGE = {
  persistence: {
    lcid: {
      type: 'cookie',
      key: 'LCID',
      serialize: false,
    },
    icid: {
      type: 'cookie',
      key: 'ICID',
      serialize: false,
    },
    currentStageId: {
      type: 'sessionStorage',
      key: 'mct_current_stage',
      serialize: false,
    },
    prefillAnswers: {
      type: 'sessionStorage',
      key: 'mct_prefill_answers',
      serialize: true,
    },
    answers: {
      type: 'localStorage',
      key: 'mct_answers',
      serialize: true,
    },
    calculations: {
      type: 'localStorage',
      key: 'mct_calculations',
      serialize: true,
    },
    mortgageId: {
      type: 'sessionStorage',
      key: 'mct_mortgage_id',
      serialize: false,
    },
  },
} as const;
