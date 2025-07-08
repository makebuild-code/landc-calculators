import { type ResponsiveConfig, type Breakpoint } from '$mct/types';
import { getCurrentBreakpoint } from '$utils/environment/getCurrentBreakpoint';

export interface SliderConfig {
  numberOfDaysPerView: ResponsiveConfig;
  numberOfDaysPerMove: ResponsiveConfig;
}

export const SLIDER_CONFIG: SliderConfig = {
  numberOfDaysPerView: { desktop: 7, tablet: 5, landscape: 4, portrait: 3 },
  numberOfDaysPerMove: { desktop: 7, tablet: 5, landscape: 4, portrait: 3 },
};

export class ConfigManager {
  private static instance: ConfigManager;
  private currentBreakpoint: Breakpoint;

  private constructor() {
    this.currentBreakpoint = getCurrentBreakpoint();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) ConfigManager.instance = new ConfigManager();
    return ConfigManager.instance;
  }

  public getCurrentBreakpoint(): Breakpoint {
    return this.currentBreakpoint;
  }

  public updateBreakpoint(): void {
    this.currentBreakpoint = getCurrentBreakpoint();
  }

  public getDaysPerView(breakpoint?: Breakpoint): number {
    return SLIDER_CONFIG.numberOfDaysPerView[breakpoint || this.currentBreakpoint];
  }

  public getDaysPerMove(breakpoint?: Breakpoint): number {
    return SLIDER_CONFIG.numberOfDaysPerMove[breakpoint || this.currentBreakpoint];
  }
}
