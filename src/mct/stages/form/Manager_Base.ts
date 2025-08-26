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
import { CalculationKeysENUM, FormEventNames, StageIDENUM } from '$mct/types';
import { removeInitialStyles } from 'src/mct/shared/utils/dom/visibility/removeInitialStyles';

import { MainGroup, OutputGroup } from './Groups';
import type { QuestionComponent } from './Questions';
import { EventBus } from '$mct/components';

const PROFILES = PROFILES_CONFIG.profiles;

export abstract class FormManager {
  protected component: HTMLElement;
  public id: StageIDENUM;
  protected eventBus: EventBus;
  protected profile: Profile | null = null;
  protected groups: (MainGroup | OutputGroup)[] = [];
  protected questions: Set<QuestionComponent> = new Set();
  protected isInitialised: boolean = false;
  protected source: 'form' | 'sidebar' = 'form';

  private _activeGroupIndex: number = 0;

  constructor(component: HTMLElement) {
    this.component = component;
    this.id = StageIDENUM.Questions;
    this.eventBus = EventBus.getInstance();

    // this.bindEvents();
  }

  /**
   * Get the current active group index
   */
  public get activeGroupIndex(): number {
    return this._activeGroupIndex;
  }

  /**
   * Set the active group index and emit change event
   */
  public set activeGroupIndex(value: number) {
    if (this._activeGroupIndex !== value) {
      const previousIndex = this._activeGroupIndex;
      this._activeGroupIndex = value;

      const activeGroup = this.getActiveGroup();

      // Emit specific event for active group index changes
      this.eventBus.emit(FormEventNames.GROUP_CHANGED, {
        previousIndex,
        currentIndex: value,
        groupId: activeGroup?.name || 'unknown',
      });
    }
  }

  public abstract init(options?: QuestionsStageOptions): void;
  public abstract show(): void;
  public abstract hide(): void;

  protected onMount(): void {
    removeInitialStyles(this.component, 1000);
  }

  protected bindEvents(): void {
    this.eventBus.on(FormEventNames.QUESTION_REQUIRED, ({ question }) => {
      this.saveQuestion(question);
    });

    this.eventBus.on(FormEventNames.QUESTION_UNREQUIRED, ({ question }) => {
      this.removeQuestion(question);
    });
  }

  protected syncQuestionsToState(): void {
    const answers = MCTManager.getAnswers();
    this.questions.forEach((question) => {
      const answer = answers[question.getStateValue('initialName') as InputKeysENUM];
      if (answer) question.setValue(answer);
    });
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

  protected saveQuestion(question: QuestionComponent): void {
    this.questions.add(question);
  }

  protected removeQuestion(question: QuestionComponent): void {
    this.questions.delete(question);
  }

  public saveAnswersToMCT(override: boolean = false): InputData[] {
    const answerDataArray: InputData[] = [];

    [...this.questions].forEach((question) => {
      const isValid = question.isValid();
      const isRequired = question.isRequired();

      if (!(isValid && isRequired)) return;

      answerDataArray.push({
        key: question.getStateValue('initialName') as InputKey,
        name: question.getStateValue('finalName') as InputName,
        value: question.getValue() as InputValue,
        valid: question.isValid(),
        location: this.source,
        source: 'user',
      });
    });

    MCTManager.overrideAnswers(answerDataArray);
    // if (override) MCTManager.overrideAnswers(answerDataArray);
    // else MCTManager.setAnswers(answerDataArray);

    return answerDataArray;
  }

  public getAnswers(context: 'main' | 'sidebar' = 'main'): Inputs {
    return { ...MCTManager.getAnswers(context) };
  }

  protected determineProfile(context: 'main' | 'sidebar' = 'main'): Profile | undefined {
    const answers = this.getAnswers(context);
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
    if (group instanceof OutputGroup) return group.getElement();
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
    if (group instanceof OutputGroup) return group.getElement();
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
