import type { MCTConfig } from '../types/config';
import { API_CONFIG } from './api';
import { STORAGE_CONFIG } from './storage';
import { DOM_CONFIG } from './dom';
import { COMPONENTS_CONFIG } from './components';
import { PROFILES_CONFIG } from './profiles';
import { ENVIRONMENT_CONFIG } from './environment';
import { FILTERS_CONFIG } from './filters';
import { EVENTS_CONFIG } from './events';

// Centralized configuration object
export const MCT_CONFIG: MCTConfig = {
  api: API_CONFIG,
  components: COMPONENTS_CONFIG,
  dom: DOM_CONFIG,
  environment: ENVIRONMENT_CONFIG,
  events: EVENTS_CONFIG,
  filters: FILTERS_CONFIG,
  profiles: PROFILES_CONFIG,
  storage: STORAGE_CONFIG,
};

// Export individual configs for specific use cases
export * from './api';
export * from './components';
export * from './dom';
export * from './environment';
export * from './events';
export * from './filters';
export * from './profiles';
export * from './storage';
