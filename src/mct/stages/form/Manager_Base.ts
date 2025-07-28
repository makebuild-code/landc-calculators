import { PROFILES_CONFIG } from '$mct/config';
import { MCTManager } from '$mct/manager';
import type {
  GroupNameENUM,
  InputData,
  InputKey,
  InputKeysENUM,
  InputName,
  Inputs,
  InputValue,
  Profile,
  QuestionsStageOptions,
} from '$mct/types';
import { CalculationKeysENUM, StageIDENUM } from '$mct/types';
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

  public activeGroupIndex: number = 0;

  constructor(component: HTMLElement) {
    this.component = component;
    this.id = StageIDENUM.Questions;
  }

  public abstract init(options?: QuestionsStageOptions): void;
  public abstract show(): void;
  public abstract hide(): void;

  protected onMount(): void {
    removeInitialStyles(this.component, 1000);
  }

  protected prefill(answers: Inputs) {
    /**
     * @todo:
     * - Loop through the answers
     * - Find the input(s) that match the answer key
     * - Set the value of the input(s)
     * - Evaluate the visibility of the input(s)
     */
  }

  public saveQuestion(question: QuestionComponent): void {
    this.questions.add(question);
  }

  public removeQuestion(question: QuestionComponent): void {
    this.questions.delete(question);
  }

  public saveAnswersToMCT(): void {
    const answerDataArray: InputData[] = [];

    [...this.questions].forEach((question) => {
      const value = question.getValue();
      const valid = question.isValid();

      if (!valid) return;

      answerDataArray.push({
        key: question.getStateValue('initialName') as InputKey,
        name: question.getStateValue('finalName') as InputName,
        value: value as InputValue,
        source: 'user',
      });
    });

    MCTManager.setAnswers(answerDataArray);
  }

  public getAnswers(): Inputs {
    return { ...MCTManager.getAnswers() };
  }

  protected determineProfile(): Profile | undefined {
    const answers = this.getAnswers();
    const profile: Profile | undefined = PROFILES.find((profile) => {
      return Object.entries(profile.requirements).every(([key, value]) => answers[key as InputKeysENUM] === value);
    });

    this.profile = profile ? profile : null;

    MCTManager.setCalculation(CalculationKeysENUM.BuyerType, profile?.display || undefined);
    return profile ? profile : undefined;
  }

  protected getLastVisibleGroup(): MainGroup | OutputGroup | undefined {
    let lastVisibleGroup: MainGroup | OutputGroup | undefined;
    this.groups.forEach((group) => {
      if (group.isVisible) lastVisibleGroup = group;
    });
    return lastVisibleGroup;
  }

  protected getFirstEl(): HTMLElement | null {
    const group = this.groups[0];
    if (group instanceof MainGroup) return group.questions[0].getElement();
    if (group instanceof OutputGroup) return group.getComponent();
    return null;
  }

  protected getLastEl(): HTMLElement | undefined {
    const group = this.groups.at(this.activeGroupIndex);
    if (group instanceof MainGroup) {
      // Find the last visible question
      const visibleQuestions = group.getVisibleQuestions();
      if (visibleQuestions.length === 0) return undefined;
      return visibleQuestions.at(-1)?.getElement();
    }
    if (group instanceof OutputGroup) return group.getComponent();
    return undefined;
  }

  protected getActiveGroup(): MainGroup | OutputGroup | undefined {
    return this.groups[this.activeGroupIndex];
  }

  public getGroupByName(name: GroupNameENUM): MainGroup | OutputGroup | undefined {
    return this.groups.find((group) => group.name === name);
  }

  public getPreviousGroupInSequence(): MainGroup | OutputGroup | undefined {
    if (this.activeGroupIndex <= 0) return undefined;
    return this.groups[0];
  }

  public get profileName(): string | null {
    return this.profile?.name || null;
  }
}
