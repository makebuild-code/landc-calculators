import { PROFILES } from '$mct/config';
import { MCTManager } from '$mct/manager';
import type {
  AnswerData,
  AnswerKey,
  AnswerName,
  Answers,
  AnswerValue,
  Profile,
  QuestionsStageOptions,
} from '$mct/types';
import { StageIDENUM } from '$mct/types';

import { MainGroup, OutputGroup } from './Groups';
import type { QuestionComponent } from './Questions';

export abstract class FormManager {
  protected component: HTMLElement;
  public id: StageIDENUM;
  protected profile: Profile | null = null;
  protected groups: (MainGroup | OutputGroup)[] = [];
  protected questions: Set<QuestionComponent> = new Set();
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

  public saveQuestion(question: QuestionComponent): void {
    this.questions.add(question);
  }

  public removeQuestion(question: QuestionComponent): void {
    this.questions.delete(question);
  }

  public getQuestions(): Set<QuestionComponent> {
    return this.questions;
  }

  public saveAnswersToMCT(): void {
    const answerDataArray: AnswerData[] = [];

    [...this.questions].forEach((question) => {
      const value = question.getValue();
      if (!value) return;

      answerDataArray.push({
        key: question.getStateValue('initialName') as AnswerKey,
        name: question.getStateValue('finalName') as AnswerName,
        value: value as AnswerValue,
        source: 'user',
      });
    });

    // console.log('saveAnswersToMCT: ', answerDataArray);

    MCTManager.setAnswers(answerDataArray);
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

  // protected reset(): void {
  //   MCTManager.clearAnswers();
  //   this.groups.forEach((group) => (group instanceof MainGroup ? group.reset() : null));
  // }
}
