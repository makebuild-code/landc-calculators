import type { Endpoints, Environment } from 'src/types';

/**
 * Returns the environment based on the hostname
 * @returns Environment
 */
export const getEnvironment = (): Environment => {
  const ENDPOINTS: Endpoints = {
    prod: 'https://www.landc.co.uk/api/',
    test: 'https://test.landc.co.uk/api/',
  };

  const ENVIRONMENTS: Environment[] = [
    { name: 'prod', host: 'www.landc.co.uk', api: ENDPOINTS.prod },
    { name: 'test', host: 'test.landc.co.uk', api: ENDPOINTS.test },
    { name: 'dev', host: 'dev.landc.co.uk', api: ENDPOINTS.test },
  ];

  const { hostname } = window.location;
  return ENVIRONMENTS.find((env) => env.host === hostname) || ENVIRONMENTS[0];
};
