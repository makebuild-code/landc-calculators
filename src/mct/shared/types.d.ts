export type StageID = 'questions' | 'output' | 'results' | 'calendar';

export type AnswerKey = string;
export type AnswerValue = string | number | (string | number)[] | null;
export type Answers = Record<AnswerKey, AnswerValue>;
