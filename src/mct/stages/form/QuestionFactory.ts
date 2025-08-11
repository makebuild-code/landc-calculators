import { QuestionComponent } from './Questions';
import { QuestionRegistry } from './QuestionRegistry';
import { FormEventNames, InputKeysENUM, type InputValue } from '$mct/types';

export interface QuestionFactoryOptions {
  groupName: string;
  indexInGroup: number;
  source: 'main' | 'sidebar';
  onChange?: () => void;
  onEnter?: () => void;
  initialValue?: InputValue;
  debug?: boolean;
}

/**
 * Factory class for consistent initialization of Question components.
 * Wraps existing HTML elements from Webflow with JavaScript behavior.
 * Automatically registers questions with the QuestionRegistry for cross-form communication.
 */
export class QuestionFactory {
  /**
   * Create a new QuestionComponent from an existing HTML element.
   * This method wraps the existing Webflow HTML with component behavior,
   * rather than creating new HTML elements.
   *
   * @param element - The existing HTML element from Webflow
   * @param options - Configuration options for the question
   * @returns The initialized QuestionComponent
   *
   * @example
   * ```typescript
   * const webflowElement = document.querySelector('[data-question="property-price"]');
   * const question = QuestionFactory.create(webflowElement, {
   *   groupName: 'residential',
   *   indexInGroup: 0,
   *   source: 'main'
   * });
   * ```
   */
  public static create(element: HTMLElement, options: QuestionFactoryOptions): QuestionComponent {
    if (!element) throw new Error('QuestionFactory.create: element is required');

    const { groupName, indexInGroup, source, onChange, onEnter, initialValue, debug } = options;

    const question = new QuestionComponent({
      element,
      groupName,
      indexInGroup,
      source,
      onChange: onChange || (() => {}), // No-op if not provided
      onEnter: onEnter || (() => {}), // No-op if not provided
      debug: debug ?? false,
    });

    if (initialValue !== undefined) {
      question.setValue(initialValue);
    }

    question.initialise();

    QuestionRegistry.getInstance().register(question);

    return question;
  }

  /**
   * Create multiple QuestionComponents from a NodeList or array of elements.
   * Useful for initializing all questions in a group at once.
   *
   * @param elements - NodeList or array of HTML elements
   * @param baseOptions - Common options for all questions (indexInGroup will be auto-incremented)
   * @returns Array of initialized QuestionComponents
   *
   * @example
   * ```typescript
   * const questionElements = document.querySelectorAll('[data-group="residential"] [data-form-question]');
   * const questions = QuestionFactory.createMultiple(questionElements, {
   *   groupName: 'residential',
   *   source: 'main'
   * });
   * ```
   */
  public static createMultiple(
    elements: NodeListOf<HTMLElement> | HTMLElement[],
    baseOptions: Omit<QuestionFactoryOptions, 'indexInGroup'>
  ): QuestionComponent[] {
    const questions: QuestionComponent[] = [];
    const elementsArray = Array.from(elements);

    elementsArray.forEach((element, index) => {
      const question = QuestionFactory.create(element, {
        ...baseOptions,
        indexInGroup: index,
      });
      questions.push(question);
    });

    return questions;
  }

  /**
   * Create a QuestionComponent and set up bidirectional sync with its counterpart.
   * This is useful when creating sidebar questions that need to stay in sync with main form questions.
   *
   * @param element - The HTML element for the new question
   * @param options - Configuration options
   * @param syncWithQuestionId - The ID of the question to sync with
   * @returns The initialized QuestionComponent with sync enabled
   */
  public static createWithSync(
    element: HTMLElement,
    options: QuestionFactoryOptions,
    syncWithQuestionId: string
  ): QuestionComponent {
    const question = QuestionFactory.create(element, options);

    const registry = QuestionRegistry.getInstance();
    registry.register(question);

    // Set up automatic synchronization with other questions of the same name
    QuestionFactory.setupAutoSync(question);

    return question;
  }

  /**
   * Destroy a question component and unregister it from the registry.
   * This should be called when removing questions from the DOM.
   *
   * @param question - The question component to destroy
   */
  public static destroy(question: QuestionComponent): void {
    // Clean up auto-sync listener if it exists
    const unsubscribe = (question as any)._autoSyncUnsubscribe;
    if (unsubscribe && typeof unsubscribe === 'function') {
      unsubscribe();
    }

    QuestionRegistry.getInstance().unregister(question);
    question.destroy();
  }

  /**
   * Destroy multiple question components.
   *
   * @param questions - Array of question components to destroy
   */
  public static destroyMultiple(questions: QuestionComponent[]): void {
    questions.forEach((question) => {
      QuestionFactory.destroy(question);
    });
  }

  /**
   * Set up automatic synchronization between questions with the same initialName.
   * When one question changes, all other questions with the same name will be updated.
   *
   * @param question - The question component to set up sync for
   */
  private static setupAutoSync(question: QuestionComponent): void {
    // We need to wait for the question to be initialized to get its ID
    // The onInit method will set the name from initialName
    const checkAndSetup = () => {
      const questionName = question.getQuestionName();
      if (!questionName) {
        // If not ready yet, try again after a short delay
        setTimeout(checkAndSetup, 10);
        return;
      }

      // Listen for changes on this question
      const unsubscribe = (question as any).on(FormEventNames.QUESTION_CHANGED, (event: any) => {
        // Get all questions with the same initialName
        const registry = QuestionRegistry.getInstance();
        const allQuestionsWithSameName = registry.getAllByName(event.name);

        // Update all other questions with the same name
        allQuestionsWithSameName.forEach((otherQuestion) => {
          // Don't update the question that triggered the change
          if (otherQuestion !== question) {
            // Use the value from the event directly
            otherQuestion.setValue(event.value);
          }
        });
      });

      // Store the unsubscribe function on the question for cleanup
      (question as any)._autoSyncUnsubscribe = unsubscribe;
    };

    // Start the setup process
    checkAndSetup();
  }
}
