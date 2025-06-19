/**
 * interfaces and types
 */

export interface Options {
  mode: 'main' | 'sidebar';
  prefill: boolean;
}

export type ProfileName =
  | 'customer-identifier'
  | 'residential-purchase'
  | 'ftb-residential-purchase'
  | 'btl-purchase'
  | 'residential-remortgage'
  | 'btl-remortgage';

export interface Profile {
  name: ProfileName;
  display: string;
  requirements: {
    [key: string]: string;
  };
}

export type Input = HTMLInputElement;
