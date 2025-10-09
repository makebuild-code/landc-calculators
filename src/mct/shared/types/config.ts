import type { StorageConfig } from '$mct/state';
import type { AppState } from './state';
import type { Profile, ResponsiveConfig } from './common';
import type { SapValueENUM } from './api/Products';

export interface CONFIG_API {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  endpoints: {
    lcid: 'EnquiryHttpTrigger';
    products: 'ProductsMCTHttpTrigger';
    lenders: 'LendersHttpTrigger';
    mortgageAppointmentSlots: 'GetMortgageAppointmentSlotsTrigger';
    createLeadAndBooking: 'CreateLeadAndBookingHttpTrigger';
    logUserEvents: 'LogEventHttpTrigger';
  };
}

export interface CONFIG_COMPONENTS {
  slider: {
    numberOfDaysPerView: ResponsiveConfig;
    numberOfDaysPerMove: ResponsiveConfig;
  };
}

export interface CONFIG_DOM {
  attributes: {
    component: string;
    stage: string;
    initial: string;
    visibility: string;
    form: Record<string, string>;
    sidebar: Record<string, string>;
    results: Record<string, string>;
    appointment: Record<string, string>;
  };
  classes: Record<string, string>;
}

export type ENVIRONMENT = 'development' | 'staging' | 'production';
export interface CONFIG_ENVIRONMENT {
  environment: ENVIRONMENT;
}

export interface CONFIG_EVENTS {
  questionsComplete: string;
  directToBroker: string;
  directToLender: string;
}

export interface CONFIG_FILTERS {
  NewBuild: boolean;
  SapValue: keyof typeof SapValueENUM;
  ShowSharedOwnership: boolean;
}

export interface CONFIG_PROFILES {
  profiles: Profile[];
}

export interface CONFIG_STORAGE {
  persistence: Record<keyof AppState, StorageConfig>;
}

export interface MCTConfig {
  api: CONFIG_API;
  components: CONFIG_COMPONENTS;
  dom: CONFIG_DOM;
  environment: CONFIG_ENVIRONMENT;
  events: CONFIG_EVENTS;
  filters: CONFIG_FILTERS;
  profiles: CONFIG_PROFILES;
  // storage: CONFIG_STORAGE;
}
