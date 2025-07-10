import type { CONFIG_EVENTS } from '$mct/types';

export const EVENTS_CONFIG: CONFIG_EVENTS = {
  questionsComplete: 'Questions_Complete',
  directToBroker: 'Direct_To_Broker',
  directToLender: 'Direct_To_Lender',
} as const;
