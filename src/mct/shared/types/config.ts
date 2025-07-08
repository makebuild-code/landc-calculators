import type { StorageConfig } from '$mct/state';
import type { AppState } from './state';
import type { Profile, ResponsiveConfig } from './common';

export interface CONFIG_API {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  endpoints: Record<string, string>;
}

export interface CONFIG_STORAGE {
  persistence: Record<keyof AppState, StorageConfig>;
}

export interface CONFIG_DOM {
  attributes: {
    component: string;
    stage: string;
    form: Record<string, string>;
    results: Record<string, string>;
    appointment: Record<string, string>;
  };
  classes: Record<string, string>;
}

export interface CONFIG_COMPONENTS {
  slider: {
    numberOfDaysPerView: ResponsiveConfig;
    numberOfDaysPerMove: ResponsiveConfig;
  };
}

export interface CONFIG_PROFILES {
  profiles: Profile[];
}

export type ENVIRONMENT = 'development' | 'staging' | 'production';
export interface CONFIG_ENVIRONMENT {
  environment: ENVIRONMENT;
}

export interface MCTConfig {
  api: CONFIG_API;

  storage: CONFIG_STORAGE;

  dom: CONFIG_DOM;

  components: CONFIG_COMPONENTS;

  profiles: CONFIG_PROFILES;

  environment: CONFIG_ENVIRONMENT;
}
