import { HOSTS } from 'src/constants';
import type { Environment } from 'src/types';

export const getEnvironment = (): Environment => {
  const { hostname, search } = window.location;
  const params = new URLSearchParams(search);

  if (params.get('dev') === 'true') return 'local';
  return hostname === HOSTS.dev ? 'dev' : hostname === HOSTS.test ? 'test' : 'master';
};
