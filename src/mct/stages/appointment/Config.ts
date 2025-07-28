import { type Breakpoint } from '$mct/types';
import { getCurrentBreakpoint } from '$utils/environment/getCurrentBreakpoint';
import { COMPONENTS_CONFIG } from '$mct/config';
const SLIDER_CONFIG = COMPONENTS_CONFIG.slider;

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
