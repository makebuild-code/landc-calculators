import type { Endpoints, Environment } from 'src/types';

export const getBaseURLForAPI = (): string => {
  const ENDPOINTS: Endpoints = {
    prod: 'https://www.landc.co.uk/api/',
    test: 'https://test.landc.co.uk/api/',
  };

  const ENVIRONMENTS: Environment[] = [
    { host: 'www.landc.co.uk', api: ENDPOINTS.prod },
    { host: 'test.landc.co.uk', api: ENDPOINTS.test },
    { host: 'dev.landc.co.uk', api: ENDPOINTS.test },
  ];

  // If window is not defined (Node.js/SSR), default to test
  if (typeof window === 'undefined') return ENDPOINTS.test;

  const { hostname, search } = window.location;
  const params = new URLSearchParams(search);
  const apiParam = params.get('api');

  if (apiParam) return ENDPOINTS[apiParam as keyof Endpoints] || ENDPOINTS.prod;
  return ENVIRONMENTS.find((env) => env.host === hostname)?.api || ENDPOINTS.prod;
};
