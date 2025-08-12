import type { GroupNameENUM, InputKeysENUM, InputValue, Inputs } from '$mct/types';
import type { QuestionComponent } from './Questions';

/**
 * Options for filtering questions when getting values
 */
export interface GetValuesOptions {
  /** Filter by context (main or sidebar) */
  context?: 'main' | 'sidebar';
  /** Only include visible questions */
  visibleOnly?: boolean;
  /** Only include valid questions */
  validOnly?: boolean;
  /** Only include required questions */
  requiredOnly?: boolean;
  /** Filter by specific group */
  groupName?: GroupNameENUM;
  /** Filter by specific question names */
  includeNames?: InputKeysENUM[];
  /** Exclude specific question names */
  excludeNames?: InputKeysENUM[];
  /** Use final names instead of initial names as keys */
  useFinalNames?: boolean;
}

/**
 * Central registry for tracking all Question components across the application.
 * Acts like a library catalog, keeping track of questions in both main form and sidebar.
 * Enables finding questions by ID or group and allows cross-form communication.
 *
 * Implements singleton pattern to ensure only one registry exists.
 */
export class QuestionRegistry {
  private static instance: QuestionRegistry;
  private questions = new Map<string, Set<QuestionComponent>>();

  private constructor() {}

  /**
   * Get the singleton instance of QuestionRegistry
   */
  public static getInstance(): QuestionRegistry {
    if (!QuestionRegistry.instance) QuestionRegistry.instance = new QuestionRegistry();
    return QuestionRegistry.instance;
  }

  /**
   * Register a question component in the registry.
   * Questions are indexed by their unique ID, with sets to handle duplicates across contexts.
   */
  public register(question: QuestionComponent): void {
    const name = question.getQuestionName();
    if (!this.questions.has(name)) this.questions.set(name, new Set());
    this.questions.get(name)!.add(question);
  }

  /**
   * Unregister a question component from the registry.
   * Used when questions are destroyed or removed from the DOM.
   */
  public unregister(question: QuestionComponent): void {
    const name = question.getQuestionName();
    const questionSet = this.questions.get(name);
    if (questionSet) {
      questionSet.delete(question);
      if (questionSet.size === 0) this.questions.delete(name);
    }
  }

  /**
   * Get a specific question by ID and context (main or sidebar).
   * Returns undefined if no matching question is found.
   */
  public getByContext(questionName: InputKeysENUM, context: 'main' | 'sidebar'): QuestionComponent[] | undefined {
    const questions = this.questions.get(questionName);
    if (!questions) return undefined;

    return Array.from(questions).filter((q) => q.getSource() === context);
  }

  /**
   * Get all questions with a specific ID across all contexts.
   * Useful for syncing values between main and sidebar forms.
   */
  public getAllByName(questionName: InputKeysENUM): QuestionComponent[] {
    const questions = this.questions.get(questionName);
    return questions ? Array.from(questions) : [];
  }

  /**
   * Get all questions belonging to a specific group.
   * Useful for group-level operations and validation.
   */
  public getAllByGroup(groupName: GroupNameENUM): QuestionComponent[] {
    const results: QuestionComponent[] = [];
    this.questions.forEach((questionSet) => {
      questionSet.forEach((question) => {
        if (question.getGroupName() === groupName) {
          results.push(question);
        }
      });
    });
    return results;
  }

  /**
   * Get all questions from a specific context (main or sidebar).
   */
  public getAllByContext(context: 'main' | 'sidebar'): QuestionComponent[] {
    const results: QuestionComponent[] = [];
    this.questions.forEach((questionSet) => {
      questionSet.forEach((question) => {
        if (question.getSource() === context) {
          results.push(question);
        }
      });
    });
    return results;
  }

  /**
   * Check if a question with the given ID exists in the registry.
   */
  public has(questionName: InputKeysENUM): boolean {
    return this.questions.has(questionName);
  }

  /**
   * Get the total number of unique question IDs in the registry.
   */
  public getUniqueCount(): number {
    return this.questions.size;
  }

  /**
   * Get the total number of question instances across all contexts.
   */
  public getTotalCount(): number {
    let count = 0;
    this.questions.forEach((questionSet) => {
      count += questionSet.size;
    });
    return count;
  }

  /**
   * Clear all questions from the registry.
   * Useful for cleanup or reset operations.
   */
  public clear(): void {
    this.questions.clear();
  }

  /**
   * Get a debug representation of the registry state.
   * Useful for development and troubleshooting.
   */
  public getDebugInfo(): {
    uniqueQuestions: number;
    totalInstances: number;
    questionMap: Record<string, { main?: boolean; sidebar?: boolean }>;
  } {
    const questionMap: Record<string, { main?: boolean; sidebar?: boolean }> = {};

    this.questions.forEach((questionSet, id) => {
      questionMap[id] = {};
      questionSet.forEach((question) => {
        questionMap[id][question.getSource()] = true;
      });
    });

    return {
      uniqueQuestions: this.getUniqueCount(),
      totalInstances: this.getTotalCount(),
      questionMap,
    };
  }

  /**
   * Get an object of question values with filtering capabilities.
   * This method is optimized for performance by using a single iteration.
   * 
   * @param options - Filtering options
   * @returns An object with question names as keys and their values
   * 
   * @example
   * ```typescript
   * // Get all visible question values
   * const visibleValues = registry.getValues({ visibleOnly: true });
   * 
   * // Get values from a specific group
   * const residentialValues = registry.getValues({ 
   *   groupName: GroupNameENUM.Residential,
   *   validOnly: true 
   * });
   * 
   * // Get values from main context only
   * const mainValues = registry.getValues({ context: 'main' });
   * ```
   */
  public getValues(options: GetValuesOptions = {}): Partial<Inputs> {
    const {
      context,
      visibleOnly = false,
      validOnly = false,
      requiredOnly = false,
      groupName,
      includeNames,
      excludeNames,
      useFinalNames = false,
    } = options;

    const values: Partial<Inputs> = {};
    const processedNames = new Set<string>();

    // Convert arrays to Sets for O(1) lookup performance
    const includeSet = includeNames ? new Set(includeNames) : null;
    const excludeSet = excludeNames ? new Set(excludeNames) : null;

    // Iterate through all questions
    this.questions.forEach((questionSet, questionName) => {
      // Early exclusion checks
      if (excludeSet && excludeSet.has(questionName as InputKeysENUM)) return;
      if (includeSet && !includeSet.has(questionName as InputKeysENUM)) return;

      // Find the appropriate question based on filters
      let selectedQuestion: QuestionComponent | null = null;

      for (const question of questionSet) {
        // Context filter
        if (context && question.getSource() !== context) continue;

        // Group filter
        if (groupName && question.getGroupName() !== groupName) continue;

        // Visibility filter
        if (visibleOnly && !question.getStateValue('isVisible')) continue;

        // Valid filter
        if (validOnly && !question.isValid()) continue;

        // Required filter
        if (requiredOnly && !question.isRequired()) continue;

        // If we reach here, this question passes all filters
        selectedQuestion = question;
        break; // Use the first matching question
      }

      // If we found a matching question, get its value
      if (selectedQuestion) {
        const value = selectedQuestion.getValue();
        if (value !== null) {
          const keyName = useFinalNames 
            ? selectedQuestion.getFinalName() 
            : selectedQuestion.getInitialName();
          
          // Ensure we don't overwrite values if multiple questions have the same key
          if (!processedNames.has(keyName)) {
            values[keyName as InputKeysENUM] = value as any;
            processedNames.add(keyName);
          }
        }
      }
    });

    return values;
  }

  /**
   * Get values for a specific journey or use case.
   * This is a convenience method that wraps getValues with common filter presets.
   * 
   * @param preset - The preset name for common filtering scenarios
   * @param additionalOptions - Additional filtering options to apply
   * @returns An object with question values
   * 
   * @example
   * ```typescript
   * // Get values for form submission
   * const submitValues = registry.getValuesByPreset('formSubmit');
   * 
   * // Get values for sidebar save
   * const sidebarValues = registry.getValuesByPreset('sidebarSave');
   * ```
   */
  public getValuesByPreset(
    preset: 'formSubmit' | 'sidebarSave' | 'allVisible' | 'allValid',
    additionalOptions: Partial<GetValuesOptions> = {}
  ): Partial<Inputs> {
    const presetOptions: Record<string, GetValuesOptions> = {
      formSubmit: {
        context: 'main',
        visibleOnly: true,
        validOnly: true,
      },
      sidebarSave: {
        context: 'sidebar',
        validOnly: true,
      },
      allVisible: {
        visibleOnly: true,
      },
      allValid: {
        validOnly: true,
      },
    };

    const options = {
      ...presetOptions[preset],
      ...additionalOptions,
    };

    return this.getValues(options);
  }
}
