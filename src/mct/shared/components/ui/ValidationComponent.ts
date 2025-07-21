import { InteractiveComponent, type InteractiveComponentOptions } from '../base/InteractiveComponent';
import { FormEventNames, MCTEventNames, type FormEvents, type MCTEvents, StageIDENUM } from '$mct/types';

export interface ValidationRule {
  id: string;
  validate: (value: any, context?: ValidationContext) => ValidationResult;
  message?: string;
  errorClass?: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  level?: 'error' | 'warning' | 'info';
}

export interface ValidationContext {
  allAnswers?: Record<string, any>;
  currentGroup?: string;
  stage?: string;
}

export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  hasBeenValidated: boolean;
}

export interface ValidationError {
  id: string;
  message: string;
  level: 'error' | 'warning' | 'info';
  field?: string;
}

export interface ValidationComponentOptions extends InteractiveComponentOptions {
  rules?: ValidationRule[];
  errorContainerSelector?: string;
  showErrorsInline?: boolean;
  validateOnChange?: boolean;
  initialState?: Partial<ValidationState>;
}

/**
 * ValidationComponent provides centralized validation logic with event-driven updates.
 * It can validate individual fields, groups, or entire forms and emit validation events.
 * 
 * Usage:
 * ```typescript
 * const validator = new ValidationComponent({
 *   element: document.querySelector('[data-mct-validation]'),
 *   rules: [
 *     {
 *       id: 'required-email',
 *       validate: (value) => ({ isValid: !!value && value.includes('@') }),
 *       message: 'Please enter a valid email address'
 *     }
 *   ]
 * });
 * ```
 */
export class ValidationComponent extends InteractiveComponent {
  private errorContainer: HTMLElement | null = null;
  private state: ValidationState;
  private rules: ValidationRule[] = [];
  private context: ValidationContext = {};
  
  private errorContainerSelector: string;
  private showErrorsInline: boolean;
  private validateOnChange: boolean;

  constructor(options: ValidationComponentOptions) {
    super(options);
    
    this.errorContainerSelector = options.errorContainerSelector || '.validation-errors';
    this.showErrorsInline = options.showErrorsInline ?? true;
    this.validateOnChange = options.validateOnChange ?? true;
    this.rules = options.rules || [];
    
    // Initialize state
    this.state = {
      isValid: true,
      errors: [],
      warnings: [],
      hasBeenValidated: false,
      ...options.initialState,
    };
  }

  protected onInit(): void {
    this.findValidationElements();
    this.updateValidationDisplay();
    this.subscribeToEvents();
  }

  protected bindEvents(): void {
    // No direct user interaction events needed
  }

  private findValidationElements(): void {
    this.errorContainer = this.queryElement(this.errorContainerSelector);
    
    if (!this.errorContainer && this.showErrorsInline) {
      this.log(`Warning: Error container not found with selector: ${this.errorContainerSelector}`);
    }
  }

  private subscribeToEvents(): void {
    if (this.validateOnChange) {
      // Listen for question changes
      this.on(FormEventNames.QUESTION_CHANGED, (payload: FormEvents[FormEventNames.QUESTION_CHANGED]) => {
        this.validateQuestion(payload.question);
      });

      // Listen for group completion
      this.on(FormEventNames.GROUP_COMPLETED, (payload: FormEvents[FormEventNames.GROUP_COMPLETED]) => {
        this.validateGroup(payload.groupId, payload.answers);
      });
    }

    // Listen for stage validation requests
    this.on(MCTEventNames.STAGE_VALIDATION_CHECK, (payload: MCTEvents[MCTEventNames.STAGE_VALIDATION_CHECK]) => {
      this.validateStage(payload.stageId);
    });
  }

  private validateQuestion(question: any): void {
    const relevantRules = this.rules.filter(rule => 
      rule.id.includes(question.id || question.name || '')
    );
    
    const results = relevantRules.map(rule => ({
      rule,
      result: rule.validate(question.getValue?.() || question.value, this.context)
    }));

    this.processValidationResults(results, `question-${question.id || question.name}`);
  }

  private validateGroup(groupId: string, answers: any[]): void {
    const groupRules = this.rules.filter(rule => rule.id.includes(groupId));
    const answerMap = answers.reduce((acc, answer) => {
      acc[answer.key] = answer.value;
      return acc;
    }, {});

    const results = groupRules.map(rule => ({
      rule,
      result: rule.validate(answerMap, { ...this.context, currentGroup: groupId })
    }));

    this.processValidationResults(results, `group-${groupId}`);
  }

  private validateStage(stageId: StageIDENUM): void {
    const stageRules = this.rules.filter(rule => rule.id.includes('stage') || rule.id.includes(stageId));
    
    const results = stageRules.map(rule => ({
      rule,
      result: rule.validate(this.context.allAnswers, { ...this.context, stage: stageId })
    }));

    this.processValidationResults(results, `stage-${stageId}`);

    // Emit stage validation result
    this.emit(MCTEventNames.STAGE_VALIDATION_CHECK, {
      stageId,
      isValid: this.state.isValid,
      errors: this.state.errors.map(e => e.message),
    });
  }

  private processValidationResults(
    results: { rule: ValidationRule; result: ValidationResult }[], 
    source: string
  ): void {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    results.forEach(({ rule, result }) => {
      if (!result.isValid) {
        const error: ValidationError = {
          id: `${rule.id}-${Date.now()}`,
          message: result.message || rule.message || 'Validation failed',
          level: result.level || 'error',
          field: source,
        };

        if (error.level === 'warning') {
          warnings.push(error);
        } else {
          errors.push(error);
        }
      }
    });

    this.updateState({
      isValid: errors.length === 0,
      errors: [...this.state.errors.filter(e => !e.field?.includes(source)), ...errors],
      warnings: [...this.state.warnings.filter(w => !w.field?.includes(source)), ...warnings],
      hasBeenValidated: true,
    });
  }

  private updateState(partialState: Partial<ValidationState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...partialState };
    
    this.updateValidationDisplay();
    this.onStateChange(previousState, this.state);
  }

  private updateValidationDisplay(): void {
    if (!this.errorContainer) return;

    // Clear existing errors
    this.errorContainer.innerHTML = '';

    // Show current errors
    if (this.state.errors.length > 0) {
      this.addClass(this.errorContainer, 'has-errors');
      this.removeClass(this.errorContainer, 'is-hidden');

      this.state.errors.forEach(error => {
        const errorEl = document.createElement('div');
        errorEl.className = `validation-error validation-error--${error.level}`;
        errorEl.setAttribute('role', 'alert');
        errorEl.setAttribute('aria-live', 'polite');
        errorEl.textContent = error.message;
        this.errorContainer!.appendChild(errorEl);
      });
    } else {
      this.removeClass(this.errorContainer, 'has-errors');
      this.addClass(this.errorContainer, 'is-hidden');
    }

    // Show warnings if any
    if (this.state.warnings.length > 0) {
      this.addClass(this.errorContainer, 'has-warnings');
      
      this.state.warnings.forEach(warning => {
        const warningEl = document.createElement('div');
        warningEl.className = `validation-warning validation-warning--${warning.level}`;
        warningEl.setAttribute('role', 'status');
        warningEl.setAttribute('aria-live', 'polite');
        warningEl.textContent = warning.message;
        this.errorContainer!.appendChild(warningEl);
      });
    }

    // Update accessibility attributes
    this.setAttribute(this.element, 'aria-invalid', String(!this.state.isValid));
    this.setAttribute(this.element, 'data-validation-state', this.state.isValid ? 'valid' : 'invalid');
  }

  protected onStateChange(previousState: ValidationState, currentState: ValidationState): void {
    this.log('Validation state changed:', {
      previous: previousState,
      current: currentState,
    });

    // Emit validation events
    if (previousState.isValid !== currentState.isValid) {
      if (currentState.isValid) {
        this.emit(FormEventNames.QUESTION_VALIDATED, {
          question: this.element as any, // Temporary - will be improved in Phase 2
        });
      }
    }
  }

  // Public API
  public addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  public setContext(context: Partial<ValidationContext>): void {
    this.context = { ...this.context, ...context };
  }

  public validate(value?: any, ruleIds?: string[]): ValidationResult {
    const rulesToCheck = ruleIds 
      ? this.rules.filter(rule => ruleIds.includes(rule.id))
      : this.rules;

    const results = rulesToCheck.map(rule => rule.validate(value, this.context));
    const hasErrors = results.some(result => !result.isValid);
    const firstError = results.find(result => !result.isValid);

    return {
      isValid: !hasErrors,
      message: firstError?.message,
      level: firstError?.level,
    };
  }

  public clearErrors(): void {
    this.updateState({
      errors: [],
      warnings: [],
      isValid: true,
    });
  }

  public getState(): ValidationState {
    return { ...this.state };
  }

  protected onDestroy(): void {
    this.errorContainer = null;
    this.rules = [];
    this.context = {};
  }
}