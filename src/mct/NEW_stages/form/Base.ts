import { StatefulManager, type StatefulManagerOptions, type StatefulManagerState } from '$mct/components';
import { PROFILES_CONFIG } from '$mct/config';
import { MCTManager } from '$mct/manager';
import type { InputData, InputKey, InputName, InputValue, Profile } from '$mct/types';
import { FormEventNames, MCTEventNames, StageIDENUM } from '$mct/types';

import { MainGroup, OutputGroup } from './Groups';
import type { QuestionComponent } from './Questions';

const PROFILES = PROFILES_CONFIG.profiles;

export type PrefillFrom = 'storage' | 'params' | 'none';

export interface BaseFormManagerOptions extends StatefulManagerOptions<BaseFormManagerState> {
  prefillFrom: PrefillFrom;
}

export interface BaseFormManagerState extends StatefulManagerState {
  profile: Profile | null;
  prefillFrom: PrefillFrom;
  groups: (MainGroup | OutputGroup)[];
  questions: Set<QuestionComponent>;
  activeGroupIndex: number;
}

export abstract class BaseFormManager extends StatefulManager<BaseFormManagerState> {
  constructor(options: BaseFormManagerOptions) {
    // Use provided initialState or generate from base + extended
    const finalInitialState =
      options.initialState ||
      (() => {
        // Create base initialState
        const baseInitialState: BaseFormManagerState = {
          id: options.id,
          isVisible: false,
          isComplete: false,
          profile: null,
          prefillFrom: options.prefillFrom,
          groups: [],
          questions: new Set(),
          activeGroupIndex: 0,
        };

        // Merge base state with extended state
        return {
          ...baseInitialState,
          ...options.extendedInitialState,
        } as BaseFormManagerState;
      })();

    super({
      ...options,
      initialState: finalInitialState,
    });
  }

  protected init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.onInit();

    this.log('QuestionsManager: init complete');
  }

  protected prefill(from: PrefillFrom) {
    if (from === 'storage') {
      // Get prefill answers from storage
    } else if (from === 'params') {
      // Get prefill answers from params
    } else return;
  }

  protected bindEvents(): void {
    // Show/hide the stage
    this.eventBus.on(MCTEventNames.STAGE_GO_TO, (payload) => this.handleGoTo(payload.stageId));

    // Save/Remove the question
    this.eventBus.on(FormEventNames.QUESTION_REQUIRED, (payload) => this.saveQuestion(payload.question));
    this.eventBus.on(FormEventNames.QUESTION_UNREQUIRED, (payload) => this.removeQuestion(payload.question));

    // Save answers to MCT
    this.eventBus.on(FormEventNames.ANSWERS_SAVED, () => this.saveAnswersToMCT());
  }

  private handleGoTo(stageId: StageIDENUM): void {
    console.log('🔄 handleGoTo', stageId);
    stageId === StageIDENUM.Questions ? this.show() : this.hide();
  }

  private saveQuestion(question: QuestionComponent): void {
    const questions = this.getStateValue('questions');
    questions.add(question);
    this.setStateValue('questions', questions);
  }

  private removeQuestion(question: QuestionComponent): void {
    const questions = this.getStateValue('questions');
    questions.delete(question);
    this.setStateValue('questions', questions);
  }

  private saveAnswersToMCT(): void {
    const answerDataArray: InputData[] = [];

    [...this.getStateValue('questions')].forEach((question) => {
      const value = question.getValue();
      if (!value) return;

      answerDataArray.push({
        key: question.getStateValue('initialName') as InputKey,
        name: question.getStateValue('finalName') as InputName,
        value: value as InputValue,
        source: 'user',
      });
    });

    MCTManager.setAnswers(answerDataArray);
  }

  protected determineProfile(): Profile | null {
    const answers = MCTManager.getAnswers();
    const profile: Profile | undefined = PROFILES.find((profile) => {
      return Object.entries(profile.requirements).every(([key, value]) => answers[key] === value);
    });

    this.setStateValue('profile', profile ? profile : null);
    return this.getStateValue('profile');
  }
}
