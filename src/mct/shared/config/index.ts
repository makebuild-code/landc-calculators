import type { MCTConfig } from '../types/config';
import { API_CONFIG } from './api';
import { STORAGE_CONFIG } from './storage';
import { DOM_CONFIG } from './dom';
import { COMPONENTS_CONFIG } from './components';
import { PROFILES_CONFIG } from './profiles';
import { ENVIRONMENT_CONFIG } from './environment';
import { FILTERS_CONFIG } from './filters';

// Centralized configuration object
export const MCT_CONFIG: MCTConfig = {
  api: API_CONFIG,
  storage: STORAGE_CONFIG,
  dom: DOM_CONFIG,
  components: COMPONENTS_CONFIG,
  profiles: PROFILES_CONFIG,
  environment: ENVIRONMENT_CONFIG,
  filters: FILTERS_CONFIG,
};

// Export individual configs for specific use cases
export * from './api';
export * from './storage';
export * from './dom';
export * from './components';
export * from './profiles';
export * from './environment';
export * from './filters';
