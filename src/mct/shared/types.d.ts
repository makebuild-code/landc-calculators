import type { ProfileName } from '../stages/form/types';

export type StageID = 'questions' | 'results' | 'calendar';

export type AnswerKey = string;
export type AnswerValue = string | number | (string | number)[] | null;
export type Answers = Record<AnswerKey, AnswerValue>;

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
