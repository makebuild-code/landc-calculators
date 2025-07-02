import { PROFILES } from 'src/mct/shared/constants';
import { MCTManager } from 'src/mct/shared/MCTManager';
import type { Answers, AnswerValue, Profile, QuestionsStageOptions } from '$mct/types';
import { StageIDENUM } from '$mct/types';

import { MainGroup, OutputGroup } from './Groups';
import type { Question } from './Questions';

export abstract class FormManager {
  protected component: HTMLElement;
  public id: StageIDENUM;
  protected profile: Profile | null = null;
  protected groups: (MainGroup | OutputGroup)[] = [];
  protected questions: Set<Question> = new Set();
  protected isInitialised: boolean = false;

  constructor(component: HTMLElement) {
    this.component = component;
    this.id = StageIDENUM.Questions;
  }

  public abstract init(options?: QuestionsStageOptions): void;
  public abstract show(): void;
  public abstract hide(): void;

  protected prefill(answers: Answers) {
    /**
     * @todo:
     * - Loop through the answers
     * - Find the input(s) that match the answer key
     * - Set the value of the input(s)
     * - Evaluate the visibility of the input(s)
     */
    // for (const [name, value] of Object.entries(answers)) {}
    // this.groups.forEach((group) => group.evaluateVisibility());
  }

  public saveQuestion(question: Question): void {
    this.questions.add(question);
  }

  public removeQuestion(question: Question): void {
    this.questions.delete(question);
  }

  public getQuestions(): Set<Question> {
    return this.questions;
  }

  public saveAnswersToMCT(): void {
    MCTManager.clearAnswers();

    [...this.questions].forEach((question) => {
      const value = question.getValue();
      if (value) MCTManager.setAnswer(question.name, value as AnswerValue);
    });
  }

  public getAnswers(): Answers {
    return { ...MCTManager.getAnswers() };
  }

  public determineProfile(): Profile | null {
    const answers = this.getAnswers();
    const profile: Profile | undefined = PROFILES.find((profile) => {
      return Object.entries(profile.requirements).every(([key, value]) => answers[key] === value);
    });

    this.profile = profile ? profile : null;
    return profile ? profile : null;
  }

  protected reset(): void {
    MCTManager.clearAnswers();
    this.groups.forEach((group) => (group instanceof MainGroup ? group.reset() : null));
  }
}
