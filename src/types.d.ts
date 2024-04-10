export type Input = HTMLInputElement | HTMLSelectElement | HTMLFieldSetElement;

export type BasicObject = {
  [key: string]: string | number;
};

export interface Result {
  [key: string]: string | number | BasicObject[];
}

export interface APIResponse {
  body: string;
  endpoint: string;
  result: Result;
}
