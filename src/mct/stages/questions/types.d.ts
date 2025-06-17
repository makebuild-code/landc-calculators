/**
 * interfaces and types
 */

export type Stage = 'questions' | 'output' | 'results' | 'calendar';

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

export type Input = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
