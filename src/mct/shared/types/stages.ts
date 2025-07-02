/**
 * Stage-related types for MCT module
 *
 * Contains types related to different stages of the MCT flow,
 * stage options, and stage management.
 */

import { ProfileNameENUM } from './common';

// Stage identifiers
export enum StageIDENUM {
  Questions = 'questions',
  Results = 'results',
  Calendar = 'calendar',
}

// Stage-specific options for goToStage function
export interface QuestionsStageOptions {
  profile?: ProfileNameENUM;
  prefill?: boolean;
}

export interface ResultsStageOptions {
  autoLoad?: boolean;
  numberOfResults?: number;
  showSummary?: boolean;
  showLenders?: boolean;
  showDetails?: boolean;
}

export interface CalendarStageOptions {
  // Add calendar-specific options here when needed
}

export type GoToStageOptions = {
  questions?: QuestionsStageOptions;
  results?: ResultsStageOptions;
  calendar?: CalendarStageOptions;
};

// Output types
export enum OutputTypeENUM {
  Sentence = 'sentence',
  Currency = 'currency',
  Percentage = 'percentage',
  ProgressBar = 'progress-bar',
}
