/**
 * Stage-related types for MCT module
 *
 * Contains types related to different stages of the MCT flow,
 * stage options, and stage management.
 */

import type { ProfileName } from './common';

// Stage identifiers
export type StageID = 'questions' | 'results' | 'calendar';
export enum StageIDENUM {
  Questions = 'questions',
  Results = 'results',
  Calendar = 'calendar',
}

// Stage-specific options for goToStage function
export interface QuestionsStageOptions {
  profile?: ProfileName;
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

// Results-specific types
export type OutputType = 'sentence' | 'currency' | 'percentage' | 'progress-bar';
export enum OutputTypeENUM {
  Sentence = 'sentence',
  Currency = 'currency',
  Percentage = 'percentage',
  ProgressBar = 'progress-bar',
}
