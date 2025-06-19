export type StageName = 'questions' | 'output' | 'results' | 'calendar';

export type AnswerKey = string;
export type AnswerValue = string | number | string[] | null;
export type Answers = Record<AnswerKey, AnswerValue>;
