export type ResultsGroupName = 'summary' | 'lenders' | 'details';

export interface ResultsData {
  key: string;
  value: string;
}

export type OutputType = 'sentence' | 'currency' | 'percentage' | 'progress-bar';
