import type { AnswerKey, AnswerValue } from '../state';
import type { ICID, LCID } from './base';

export interface LogUserEventDefault {
  LCID: LCID;
  ICID: ICID;
  FormValues: Record<AnswerKey, AnswerValue>;
  CreatedBy: 'MCT';
}

export interface LogUserEventCustom {
  EventName: string;
  EventValue: string;
  FieldName: AnswerKey;
  FieldValue: AnswerValue;
}

export interface LogUserEventRequest extends LogUserEventDefault, LogUserEventCustom {}

export interface LogUserEventResponse {
  url: string;
  body: string;
  result: {
    status: string;
    message: string;
  };
  error?: {
    type: string;
    title: string;
    detail: string;
    instance: string;
    errors?: Record<string, string[]>;
  };
}
