import type { CONFIG_ENVIRONMENT, ENVIRONMENT } from '$mct/types';
import { isStaging } from '$utils/environment/isStaging';

export const getEnvironment = (): ENVIRONMENT => {
  if (process.env.NODE_ENV === 'development') return 'development';
  if (isStaging) return 'staging';
  return 'production';
};

export const ENVIRONMENT_CONFIG: CONFIG_ENVIRONMENT = {
  environment: getEnvironment(),
};
