import type { StateManager } from './StateManager';
import type { Inputs, Calculations, InputKey, CalculationKey } from '$mct/types';
import { DOM_CONFIG } from '$mct/config';
import { queryElements } from '$utils/dom';
import { toggleElement } from '../utils/dom/visibility';

/**
 * Visibility condition parser and evaluator
 */
interface VisibilityCondition {
  variable: string;
  operator: 'equals' | 'not_equals' | 'empty' | 'not_empty' | 'greater_than' | 'less_than' | 'contains';
  value?: string | number | boolean;
}

/**
 * Visibility Manager for MCT components
 *
 * Handles dynamic visibility of DOM elements based on:
 * - Input answers (from StateManager)
 * - Calculated values (from CalculationManager)
 * - Complex conditional expressions
 *
 * Usage:
 * - Add data-mct-visible-if="{PurchRemo} = Purchase" to elements
 * - Add data-mct-visible-if="{LTV} > 80" for calculations
 * - Add data-mct-visible-if="{PropertyValue} not empty" for existence checks
 */
export class VisibilityManager {
  private stateManager: StateManager;
  private elements: Map<HTMLElement, string> = new Map();
  private visibilityCache: Map<HTMLElement, boolean> = new Map();

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.subscribeToStateChanges();
  }

  /**
   * Initialize visibility manager for a component
   */
  public initialize(component: HTMLElement): void {
    const elementsWithVisibility = queryElements(`[${DOM_CONFIG.attributes.visibility}]`, component);

    elementsWithVisibility.forEach((element) => {
      if (element instanceof HTMLElement) {
        const condition = element.getAttribute(DOM_CONFIG.attributes.visibility);
        if (condition) {
          this.elements.set(element, condition);
          this.evaluateElementVisibility(element, condition);
        }
      }
    });
  }

  /**
   * Subscribe to state changes to update visibility
   */
  private subscribeToStateChanges(): void {
    this.stateManager.subscribe((event) => {
      if (event.changes.inputs || event.changes.calculations) {
        this.updateAllVisibility();
      }
    });
  }

  /**
   * Update visibility for all registered elements
   */
  private updateAllVisibility(): void {
    this.elements.forEach((condition, element) => {
      this.evaluateElementVisibility(element, condition);
    });
  }

  /**
   * Evaluate visibility condition for a single element
   */
  private evaluateElementVisibility(element: HTMLElement, condition: string): void {
    const isVisible = this.evaluateCondition(condition);

    // Only update if visibility has changed
    const currentVisibility = this.visibilityCache.get(element);
    if (currentVisibility !== isVisible) {
      this.visibilityCache.set(element, isVisible);
      toggleElement(element, isVisible);
    }
  }

  /**
   * Parse and evaluate a visibility condition
   */
  private evaluateCondition(condition: string): boolean {
    try {
      // Handle simple variable existence checks
      if (condition.includes('not empty')) {
        const variable = this.extractVariable(condition);
        return this.isVariableNotEmpty(variable);
      }

      if (condition.includes('empty')) {
        const variable = this.extractVariable(condition);
        return this.isVariableEmpty(variable);
      }

      // Handle comparison operators
      const parsedCondition = this.parseCondition(condition);
      if (!parsedCondition) return true;

      return this.evaluateParsedCondition(parsedCondition);
    } catch (error) {
      console.warn('Visibility condition evaluation failed:', condition, error);
      return true; // Default to visible on error
    }
  }

  /**
   * Extract variable name from condition
   */
  private extractVariable(condition: string): string {
    const match = condition.match(/\{([^}]+)\}/);
    return match ? match[1] : '';
  }

  /**
   * Parse condition into structured format
   */
  private parseCondition(condition: string): VisibilityCondition | null {
    // Match patterns like "{Variable} = Value", "{Variable} > 80", etc.
    const patterns = [
      /\{([^}]+)\}\s*=\s*(.+)/, // equals
      /\{([^}]+)\}\s*!=\s*(.+)/, // not equals
      /\{([^}]+)\}\s*>\s*(.+)/, // greater than
      /\{([^}]+)\}\s*<\s*(.+)/, // less than
      /\{([^}]+)\}\s*contains\s*(.+)/, // contains
    ];

    for (const pattern of patterns) {
      const match = condition.match(pattern);
      if (match) {
        const [, variable, value] = match;
        let operator: VisibilityCondition['operator'] = 'equals';

        if (condition.includes('!=')) operator = 'not_equals';
        else if (condition.includes('>')) operator = 'greater_than';
        else if (condition.includes('<')) operator = 'less_than';
        else if (condition.includes('contains')) operator = 'contains';

        return {
          variable: variable.trim(),
          operator,
          value: this.parseValue(value.trim()),
        };
      }
    }

    return null;
  }

  /**
   * Parse value from string to appropriate type
   */
  private parseValue(value: string): string | number | boolean {
    // Handle boolean values
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Handle numbers
    if (!isNaN(Number(value))) return Number(value);

    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // Return as string
    return value;
  }

  /**
   * Evaluate a parsed condition
   */
  private evaluateParsedCondition(condition: VisibilityCondition): boolean {
    const variableValue = this.getVariableValue(condition.variable);

    switch (condition.operator) {
      case 'equals':
        return this.compareValues(variableValue, condition.value, 'equals');
      case 'not_equals':
        return this.compareValues(variableValue, condition.value, 'not_equals');
      case 'greater_than':
        return this.compareValues(variableValue, condition.value, 'greater_than');
      case 'less_than':
        return this.compareValues(variableValue, condition.value, 'less_than');
      case 'contains':
        return this.compareValues(variableValue, condition.value, 'contains');
      default:
        return true;
    }
  }

  /**
   * Get variable value from either inputs or calculations
   */
  private getVariableValue(variable: string): any {
    const answers = this.stateManager.getAnswers();
    const calculations = this.stateManager.getCalculations();

    // Check in answers first
    if (variable in answers) {
      return answers[variable as keyof Inputs];
    }

    // Check in calculations
    if (variable in calculations) {
      return calculations[variable as keyof Calculations];
    }

    return undefined;
  }

  /**
   * Check if variable is not empty
   */
  private isVariableNotEmpty(variable: string): boolean {
    const value = this.getVariableValue(variable);
    return value !== undefined && value !== null && value !== '';
  }

  /**
   * Check if variable is empty
   */
  private isVariableEmpty(variable: string): boolean {
    const value = this.getVariableValue(variable);
    return value === undefined || value === null || value === '';
  }

  /**
   * Compare values with different operators
   */
  private compareValues(a: any, b: any, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return a === b;
      case 'not_equals':
        return a !== b;
      case 'greater_than':
        return Number(a) > Number(b);
      case 'less_than':
        return Number(a) < Number(b);
      case 'contains':
        return String(a).includes(String(b));
      default:
        return false;
    }
  }

  /**
   * Manually add an element to visibility management
   */
  public addElement(element: HTMLElement, condition: string): void {
    this.elements.set(element, condition);
    this.evaluateElementVisibility(element, condition);
  }

  /**
   * Remove an element from visibility management
   */
  public removeElement(element: HTMLElement): void {
    this.elements.delete(element);
    this.visibilityCache.delete(element);
  }

  /**
   * Force update visibility for all elements
   */
  public forceUpdate(): void {
    this.updateAllVisibility();
  }

  /**
   * Get current visibility state of an element
   */
  public isElementVisible(element: HTMLElement): boolean {
    return this.visibilityCache.get(element) ?? true;
  }

  /**
   * Get all elements currently managed by visibility
   */
  public getManagedElements(): HTMLElement[] {
    return Array.from(this.elements.keys());
  }
}
