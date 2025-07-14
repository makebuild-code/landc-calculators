import { PROFILES_CONFIG } from '$mct/config';
import { MCTManager } from '$mct/manager';
import type {
  InputData,
  InputKey,
  InputName,
  Inputs,
  InputValue,
  LogUserEventCustom,
  LogUserEventRequest,
  Profile,
  QuestionsStageOptions,
} from '$mct/types';
import { StageIDENUM } from '$mct/types';
import { removeInitialStyles } from 'src/mct/shared/utils/dom/visibility/removeInitialStyles';

import { MainGroup, OutputGroup } from './Groups';
import type { QuestionComponent } from './Questions';

const PROFILES = PROFILES_CONFIG.profiles;

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

  protected onMount(): void {
    removeInitialStyles(this.component);
  }

  protected prefill(answers: Inputs) {
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

  // public getQuestions(): Set<QuestionComponent> {
  //   return this.questions;
  // }

  public saveAnswersToMCT(): void {
    const answerDataArray: InputData[] = [];

    [...this.questions].forEach((question) => {
      const value = question.getValue();
      if (!value) return;

      answerDataArray.push({
        key: question.getStateValue('initialName') as InputKey,
        name: question.getStateValue('finalName') as InputName,
        value: value as InputValue,
        source: 'user',
      });
    });

    // console.log('saveAnswersToMCT: ', answerDataArray);

    MCTManager.setAnswers(answerDataArray);
  }

  public getAnswers(): Inputs {
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
}
