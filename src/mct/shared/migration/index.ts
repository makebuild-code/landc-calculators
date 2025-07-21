export { EventBridge, eventBridge } from './EventBridge';

// Migration utilities and helpers will be added here as needed
export const MIGRATION_CONFIG = {
  // Feature flags for gradual rollout
  ENABLE_EVENT_BRIDGE: true,
  ENABLE_NEW_NAVIGATION: false,
  ENABLE_NEW_VALIDATION: false,
  ENABLE_NEW_API_STATE: false,
  
  // Debug settings
  DEBUG_EVENT_BRIDGE: false,
  DEBUG_COMPONENTS: false,
  
  // Migration phases
  CURRENT_PHASE: 1, // Phase 1: Foundation
  TOTAL_PHASES: 5,
} as const;

/**
 * Utility to check if a feature is enabled during migration
 */
export function isMigrationFeatureEnabled(feature: keyof typeof MIGRATION_CONFIG): boolean {
  return MIGRATION_CONFIG[feature] === true;
}

/**
 * Utility to get current migration phase info
 */
export function getMigrationPhaseInfo(): { current: number; total: number; percentage: number } {
  return {
    current: MIGRATION_CONFIG.CURRENT_PHASE,
    total: MIGRATION_CONFIG.TOTAL_PHASES,
    percentage: (MIGRATION_CONFIG.CURRENT_PHASE / MIGRATION_CONFIG.TOTAL_PHASES) * 100,
  };
}