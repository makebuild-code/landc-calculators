export type Input = HTMLInputElement | HTMLSelectElement | HTMLFieldSetElement | HTMLC;export type Input = (HTMLInputElement | HTMLSelectElement | HTMLFieldSetElement) & {
  class?: string;
};
export type BasicObject = {
  [key: string]: string | number;
};

export type InputArray = string[];

export type InputObject = {
  [key: string]: string | boolean | InputArray;
};

export type InputType = {
  [key: string]: string | boolean | InputArray | InputObject;
};

export interface Result {
  [key: string]: string | number | BasicObject[];
}

export interface APIResponse {
  body: string;
  endpoint: string;
  result: Result;
}
