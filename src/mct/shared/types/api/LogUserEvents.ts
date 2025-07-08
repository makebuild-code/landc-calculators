import type { ICID, LCID } from './base';

export interface LogUserEventRequest {
  LCID: LCID;
  ICID: ICID;
  Event: string;
  FieldName?: string | null;
  FieldValue?: string | null;
  CreatedBy: 'MCT';
}

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
