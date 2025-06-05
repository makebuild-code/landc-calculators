import type { Endpoints, Environment } from 'src/types';

export const getBaseURLForAPI = (): string => {
  const ENDPOINTS: Endpoints = {
    production: 'https://www.landc.co.uk/api/',
    test: 'https://test.landc.co.uk/api/',
  };

  const ENVIRONMENTS: Environment[] = [
    { host: 'www.landc.co.uk', api: ENDPOINTS.production },
    { host: 'test.landc.co.uk', api: ENDPOINTS.test },
    { host: 'dev.landc.co.uk', api: ENDPOINTS.test },
  ];

  const { hostname } = window.location;

  return ENVIRONMENTS.find((env) => env.host === hostname)?.api || ENDPOINTS.production;
};
