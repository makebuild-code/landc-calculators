import type { Breakpoint } from '$mct/types';

export const getCurrentBreakpoint = (): Breakpoint => {
  const width = window.innerWidth;
  if (width > 991) return 'desktop';
  if (width > 767) return 'tablet';
  if (width > 478) return 'landscape';
  return 'portrait';
};
