export interface BaseResponse<T = Record<string, unknown>> {
  body: string;
  result: T;
  url: string;
}
