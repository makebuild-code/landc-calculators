import { globalEventBus } from '$mct/components';
import {
  FormEventNames,
  MCTEventNames,
  APIEventNames,
  StateEventNames,
  type FormEvents,
  type MCTEvents,
  type APIEvents,
  type StateEvents,
  type InputData,
  StageIDENUM,
} from '$mct/types';

/**
 * EventBridge provides backward compatibility during the migration from
 * manager-based architecture to event-driven architecture.
 * 
 * It translates legacy manager method calls into events and vice versa,
 * allowing old and new code to coexist during the migration process.
 */
export class EventBridge {
  private static instance: EventBridge | null = null;
  private isEnabled = true;
  private debugMode = false;

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): EventBridge {
    if (!EventBridge.instance) {
      EventBridge.instance = new EventBridge();
    }
    return EventBridge.instance;
  }

  /**
   * Enable or disable the event bridge
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.log(`EventBridge ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable debug mode for detailed logging
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.log(`EventBridge debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  private log(message: string, data?: any): void {
    if (this.debugMode) {
      console.log(`🌉 EventBridge: ${message}`, data || '');
    }
  }

  private setupEventListeners(): void {
    // Listen to events that might need to trigger legacy manager methods
    this.setupFormEventListeners();
    this.setupNavigationEventListeners();
    this.setupAPIEventListeners();
    this.setupStateEventListeners();
  }

  private setupFormEventListeners(): void {
    // Form navigation events -> Legacy manager calls
    globalEventBus.on(FormEventNames.NAVIGATION_NEXT, (payload: FormEvents[FormEventNames.NAVIGATION_NEXT]) => {
      if (!this.isEnabled) return;
      this.log('Bridging NAVIGATION_NEXT event to legacy', payload);
      
      // This would call legacy manager methods during migration
      this.callLegacyMethod('FormManager', 'handleNext', payload);
    });

    globalEventBus.on(FormEventNames.NAVIGATION_PREV, (payload: FormEvents[FormEventNames.NAVIGATION_PREV]) => {
      if (!this.isEnabled) return;
      this.log('Bridging NAVIGATION_PREV event to legacy', payload);
      
      this.callLegacyMethod('FormManager', 'handlePrev', payload);
    });

    // Form validation events -> Legacy validation
    globalEventBus.on(FormEventNames.QUESTION_VALIDATED, (payload: FormEvents[FormEventNames.QUESTION_VALIDATED]) => {
      if (!this.isEnabled) return;
      this.log('Bridging QUESTION_VALIDATED event to legacy', payload);
      
      this.callLegacyMethod('FormManager', 'updateValidation', payload);
    });

    // Group completion -> Legacy progression
    globalEventBus.on(FormEventNames.GROUP_COMPLETED, (payload: FormEvents[FormEventNames.GROUP_COMPLETED]) => {
      if (!this.isEnabled) return;
      this.log('Bridging GROUP_COMPLETED event to legacy', payload);
      
      this.callLegacyMethod('FormManager', 'handleGroupCompletion', payload);
    });
  }

  private setupNavigationEventListeners(): void {
    // Stage transitions
    globalEventBus.on(MCTEventNames.STAGE_TRANSITION_REQUEST, (payload: MCTEvents[MCTEventNames.STAGE_TRANSITION_REQUEST]) => {
      if (!this.isEnabled) return;
      this.log('Bridging STAGE_TRANSITION_REQUEST to legacy', payload);
      
      // Call legacy MCTManager.goToStage
      this.callLegacyMethod('MCTManager', 'goToStage', {
        stageId: payload.toStage,
        options: payload.options,
      });
    });
  }

  private setupAPIEventListeners(): void {
    // Products API events -> Legacy handling
    globalEventBus.on(APIEventNames.PRODUCTS_SUCCESS, (payload: APIEvents[APIEventNames.PRODUCTS_SUCCESS]) => {
      if (!this.isEnabled) return;
      this.log('Bridging PRODUCTS_SUCCESS to legacy', payload);
      
      this.callLegacyMethod('ResultsManager', 'handleProductsLoaded', payload);
    });

    globalEventBus.on(APIEventNames.PRODUCTS_ERROR, (payload: APIEvents[APIEventNames.PRODUCTS_ERROR]) => {
      if (!this.isEnabled) return;
      this.log('Bridging PRODUCTS_ERROR to legacy', payload);
      
      this.callLegacyMethod('ResultsManager', 'handleProductsError', payload);
    });

    // Lenders API events -> Legacy handling
    globalEventBus.on(APIEventNames.LENDERS_SUCCESS, (payload: APIEvents[APIEventNames.LENDERS_SUCCESS]) => {
      if (!this.isEnabled) return;
      this.log('Bridging LENDERS_SUCCESS to legacy', payload);
      
      this.callLegacyMethod('Questions', 'populateLenderOptions', payload);
    });
  }

  private setupStateEventListeners(): void {
    // State changes -> Legacy synchronization
    globalEventBus.on(StateEventNames.CHANGED, (payload: StateEvents[StateEventNames.CHANGED]) => {
      if (!this.isEnabled) return;
      this.log('Bridging STATE_CHANGED to legacy', payload);
      
      // Notify legacy managers of state changes
      this.callLegacyMethod('MCTManager', 'syncLegacyState', payload);
    });

    // Calculation requests -> Legacy calculation triggers
    globalEventBus.on(StateEventNames.CALCULATION_REQUEST, (payload: StateEvents[StateEventNames.CALCULATION_REQUEST]) => {
      if (!this.isEnabled) return;
      this.log('Bridging CALCULATION_REQUEST to legacy', payload);
      
      this.callLegacyMethod('MCTManager', 'recalculate', payload);
    });
  }

  private callLegacyMethod(managerName: string, methodName: string, payload: any): void {
    try {
      // This is where we would actually call legacy manager methods
      // During migration, we'll implement the actual calls based on available managers
      
      this.log(`Would call ${managerName}.${methodName}`, payload);
      
      // Example of how this might work:
      // if (window.MCTManager && managerName === 'MCTManager') {
      //   (window.MCTManager as any)[methodName]?.(payload);
      // }
      
    } catch (error) {
      console.error(`EventBridge: Failed to call ${managerName}.${methodName}`, error);
    }
  }

  // Public API for legacy code to emit events
  
  /**
   * Legacy managers can call this to emit events when their state changes
   */
  public emitFormStateChange(groupId: string, data: Partial<InputData>): void {
    if (!this.isEnabled) return;
    
    globalEventBus.emit(FormEventNames.GROUP_CHANGED, {
      groupId,
      activeQuestionIndex: 0, // Would need to be provided by legacy
      totalQuestions: 0, // Would need to be provided by legacy
    });
  }

  /**
   * Legacy managers can call this to emit navigation updates
   */
  public emitNavigationUpdate(nextEnabled: boolean, prevEnabled: boolean): void {
    if (!this.isEnabled) return;
    
    globalEventBus.emit(FormEventNames.NAVIGATION_UPDATE, {
      nextEnabled,
      prevEnabled,
    });
  }

  /**
   * Legacy managers can call this to emit stage transitions
   */
  public emitStageTransition(fromStage: StageIDENUM, toStage: StageIDENUM, success: boolean): void {
    if (!this.isEnabled) return;
    
    globalEventBus.emit(MCTEventNames.STAGE_TRANSITION_COMPLETE, {
      fromStage,
      toStage,
      success,
    });
  }

  /**
   * Legacy managers can call this to emit API loading states
   */
  public emitAPILoading(type: 'products' | 'lenders', data?: any): void {
    if (!this.isEnabled) return;
    
    if (type === 'products') {
      globalEventBus.emit(APIEventNames.PRODUCTS_LOADING, {
        searchCriteria: data,
      });
    } else if (type === 'lenders') {
      globalEventBus.emit(APIEventNames.LENDERS_LOADING, {});
    }
  }

  /**
   * Legacy managers can call this to emit API success states
   */
  public emitAPISuccess(type: 'products' | 'lenders', data: any): void {
    if (!this.isEnabled) return;
    
    if (type === 'products') {
      globalEventBus.emit(APIEventNames.PRODUCTS_SUCCESS, {
        products: data.products || data,
        totalCount: data.totalCount || data.length || 0,
        searchCriteria: data.searchCriteria,
      });
    } else if (type === 'lenders') {
      globalEventBus.emit(APIEventNames.LENDERS_SUCCESS, {
        lenders: data,
      });
    }
  }

  /**
   * Legacy managers can call this to emit API error states
   */
  public emitAPIError(type: 'products' | 'lenders', error: Error, data?: any): void {
    if (!this.isEnabled) return;
    
    if (type === 'products') {
      globalEventBus.emit(APIEventNames.PRODUCTS_ERROR, {
        error,
        searchCriteria: data,
      });
    } else if (type === 'lenders') {
      globalEventBus.emit(APIEventNames.LENDERS_ERROR, {
        error,
      });
    }
  }

  /**
   * Legacy managers can call this to emit validation results
   */
  public emitValidationResult(isValid: boolean, errors: string[] = []): void {
    if (!this.isEnabled) return;
    
    // This would emit appropriate validation events
    this.log('Emitting validation result from legacy', { isValid, errors });
  }

  /**
   * Cleanup method for testing or when disabling the bridge
   */
  public destroy(): void {
    this.setEnabled(false);
    EventBridge.instance = null;
  }
}

// Global instance for easy access
export const eventBridge = EventBridge.getInstance();

// Make available globally for legacy code during migration
if (typeof window !== 'undefined') {
  (window as any).MCTEventBridge = eventBridge;
}