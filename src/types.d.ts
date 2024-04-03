export type Input = HTMLInputElement | HTMLSelectElement | HTMLFieldSetElement;

export interface APIResponse {
  body: string;
  endpoint: string;
  result: Result;
}
