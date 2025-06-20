/**
 * interfaces and types
 */

export interface Options {
  mode: 'main' | 'sidebar';
  prefill: boolean;
}

export type ProfileName =
  | 'residential-purchase'
  | 'ftb-residential-purchase'
  | 'btl-purchase'
  | 'residential-remortgage'
  | 'btl-remortgage';

export type GroupName = ProfileName | 'customer-identifier' | 'output';

export interface Profile {
  name: ProfileName;
  display: string;
  requirements: {
    [key: string]: string;
  };
}

export type Input = HTMLInputElement;
