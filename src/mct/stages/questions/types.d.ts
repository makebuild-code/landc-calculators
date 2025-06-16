/**
 * interfaces and types
 */

export type Stage = 'questions' | 'output' | 'results' | 'calendar';

export type Customer =
  | 'resi-purchase'
  | 'ftb-resi-purchase'
  | 'resi-mortgage'
  | 'btl-remo'
  | 'btl-purchase';

export type Input = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
