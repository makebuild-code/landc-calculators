export interface BaseResponse<T = Record<string, unknown>> {
  url: string;
  body: string;
  result: T;
}
