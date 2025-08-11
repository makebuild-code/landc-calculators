import type { QuestionComponent } from './Questions';

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
    if (!QuestionRegistry.instance) {
      QuestionRegistry.instance = new QuestionRegistry();
    }
    return QuestionRegistry.instance;
  }

  /**
   * Register a question component in the registry.
   * Questions are indexed by their unique ID, with sets to handle duplicates across contexts.
   */
  public register(question: QuestionComponent): void {
    const id = question.getQuestionId();
    if (!this.questions.has(id)) this.questions.set(id, new Set());
    this.questions.get(id)!.add(question);
  }

  /**
   * Unregister a question component from the registry.
   * Used when questions are destroyed or removed from the DOM.
   */
  public unregister(question: QuestionComponent): void {
    const id = question.getQuestionId();
    const questionSet = this.questions.get(id);
    if (questionSet) {
      questionSet.delete(question);
      if (questionSet.size === 0) this.questions.delete(id);
    }
  }

  /**
   * Get a specific question by ID and context (main or sidebar).
   * Returns undefined if no matching question is found.
   */
  public getByContext(questionId: string, context: 'main' | 'sidebar'): QuestionComponent | undefined {
    const questions = this.questions.get(questionId);
    if (!questions) return undefined;

    return Array.from(questions).find((q) => q.getSource() === context);
  }

  /**
   * Get all questions with a specific ID across all contexts.
   * Useful for syncing values between main and sidebar forms.
   */
  public getAllById(questionId: string): QuestionComponent[] {
    const questions = this.questions.get(questionId);
    return questions ? Array.from(questions) : [];
  }

  /**
   * Get all questions belonging to a specific group.
   * Useful for group-level operations and validation.
   */
  public getAllByGroup(groupName: string): QuestionComponent[] {
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
  public has(questionId: string): boolean {
    return this.questions.has(questionId);
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
}
