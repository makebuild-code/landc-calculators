import { QuestionComponent } from './Questions';
import { QuestionRegistry } from './QuestionRegistry';
import type { InputValue } from '$mct/types';

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
    if (!element) {
      throw new Error('QuestionFactory.create: element is required');
    }

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
    const counterpartContext = options.source === 'main' ? 'sidebar' : 'main';
    const counterpart = registry.getByContext(syncWithQuestionId, counterpartContext);

    if (counterpart) {
      const currentValue = counterpart.getValue();
      if (currentValue !== null) {
        question.setValue(currentValue);
      }
    }

    return question;
  }

  /**
   * Destroy a question component and unregister it from the registry.
   * This should be called when removing questions from the DOM.
   *
   * @param question - The question component to destroy
   */
  public static destroy(question: QuestionComponent): void {
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
   * Get or create a question component from an element.
   * If a question already exists for the element, return it.
   * Otherwise, create a new one with the provided options.
   *
   * This prevents duplicate initialization of the same element.
   */
  public static getOrCreate(element: HTMLElement, options: QuestionFactoryOptions): QuestionComponent {
    const registry = QuestionRegistry.getInstance();

    const questionId = `${options.groupName}-${element.getAttribute('data-form-name') || element.getAttribute('name') || ''}`;
    const existing = registry.getByContext(questionId, options.source);

    if (existing && existing.getElement() === element) {
      return existing;
    }

    return QuestionFactory.create(element, options);
  }
}
