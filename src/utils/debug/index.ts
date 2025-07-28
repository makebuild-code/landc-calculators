import { getEnvironment } from '$utils/environment/getEnvironment';

export const debugLog = (...args: any[]) => {
  if (getEnvironment().name === 'prod') return;
  console.log('[DEBUG]', ...args);
};

export const debugWarn = (...args: any[]) => {
  if (getEnvironment().name === 'prod') return;
  console.warn('[WARN]', ...args);
};

export const debugError = (...args: any[]) => {
  if (getEnvironment().name === 'prod') return;
  console.error('[ERROR]', ...args);
};
