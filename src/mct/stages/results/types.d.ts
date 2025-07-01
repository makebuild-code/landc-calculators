export interface ResultsOptions {
  // prefill: boolean;
  // autoLoad?: boolean; // auto-fetch results on init
  // numberOfResults?: number; // how many products to show in details
  // showSummary?: boolean;
  // showLenders?: boolean;
  // showDetails?: boolean;
  // onError?: (err: unknown) => void;
}

export type ResultsGroupName = 'summary' | 'lenders' | 'details';

export interface ResultsData {
  key: string;
  value: string;
}

export type OutputType = 'sentence' | 'currency' | 'percentage' | 'progress-bar';
