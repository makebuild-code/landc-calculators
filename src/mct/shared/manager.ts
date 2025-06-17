import type { QuestionGroup } from '../stages/questions/QuestionGroup';
import type { QuestionItem } from '../stages/questions/QuestionItem';
import type { Profile } from '../stages/questions/types';
import { PROFILES } from './constants';

interface QuestionState {
  componentEl: HTMLElement | null;
  groups: QuestionGroup[];
  currentGroupIndex: number;
  currentQuestionIndex: number;
  answers: Record<AnswerKey, AnswerValue>;
  profile: Profile | null;
}

interface AppState {
  lcid: string | null;
  questions: QuestionState;
}

export type AnswerKey = string;
export type AnswerValue = string | number | string[] | null;

const state: AppState = {
  lcid: null,
  questions: {
    componentEl: null,
    currentGroupIndex: 0,
    currentQuestionIndex: 0,
    answers: {},
    groups: [],
    profile: null,
  },
};

export const manager = {
  registerGroup(group: QuestionGroup) {
    state.questions.groups.push(group);
  },

  getActiveGroupIndex(): number {
    return state.questions.currentGroupIndex;
  },

  getActiveGroup(): QuestionGroup | undefined {
    return state.questions.groups[this.getActiveGroupIndex()];
  },

  determineProfile(): Profile | null {
    const answers = this.getQuestionAnswers();
    console.log('Answers:', answers);

    const profile: Profile | undefined = PROFILES.find((profile) => {
      return Object.entries(profile.requirements).every(([key, value]) => answers[key] === value);
    });

    console.log('Profile:', profile);

    state.questions.profile = profile ? profile : null;
    return profile ? profile : null;
  },

  findGroupByProfile(profile: Profile): QuestionGroup | undefined {
    return state.questions.groups.find((group) => group.profileName === profile.name);
  },

  getNextGroupInSequence(): QuestionGroup | undefined {
    return state.questions.groups[this.getActiveGroupIndex() + 1];
  },

  getPreviousGroupInSequence(): QuestionGroup | undefined {
    if (this.getActiveGroupIndex() <= 0) return undefined;
    return state.questions.groups[this.getActiveGroupIndex() - 1];
  },

  navigateToNextGroup() {
    const currentGroup = this.getActiveGroup();
    if (!currentGroup) return;

    if (this.getActiveGroupIndex() === 0) {
      const profile = this.determineProfile();
      if (!profile) {
        console.log('Could not determine profile');
        return;
      }

      const nextGroup = this.findGroupByProfile(profile);
      if (!nextGroup) {
        console.log('No matching group found for profile:', profile);
        return;
      }

      const nextGroupIndex = this.getGroups().indexOf(nextGroup);
      if (nextGroupIndex === -1) {
        console.log('Next group index not found');
        return;
      }

      state.questions.currentGroupIndex = nextGroupIndex;
      nextGroup.show();
      const firstVisibleIndex = nextGroup.getNextVisibleIndex(-1);
      if (firstVisibleIndex < nextGroup.questions.length) {
        nextGroup.currentQuestionIndex = firstVisibleIndex;
        const firstQuestion = nextGroup.getCurrentQuestion();
        nextGroup.activateQuestion(firstQuestion);
        nextGroup.onInputChange(firstQuestion.isValid());
      }
    } else {
      console.log('End of groups');
      console.log('Initiate logic for showing output');
    }
  },

  navigateToPreviousGroup() {
    /**
     * @todo: check if this keeps groups active that shouldn't be
     */
    const previousGroup = this.getPreviousGroupInSequence();
    if (!previousGroup) {
      console.log('no previous group');
      return;
    }

    const previousGroupIndex = state.questions.groups.indexOf(previousGroup);
    if (previousGroupIndex === -1) {
      console.log('previous group not found');
      return;
    }

    state.questions.currentGroupIndex = previousGroupIndex;
    // previousGroup.show();
    const lastVisibleIndex = previousGroup.getPrevVisibleIndex(previousGroup.questions.length);
    if (lastVisibleIndex >= 0) {
      previousGroup.currentQuestionIndex = lastVisibleIndex;
      previousGroup.activateQuestion(previousGroup.getCurrentQuestion());
      return;
    }
  },

  getGroups() {
    return state.questions.groups;
  },

  setQuestionsComponent(el: HTMLElement) {
    state.questions.componentEl = el;
  },

  getQuestionsComponent(): HTMLElement {
    if (!state.questions.componentEl) throw new Error('Component not set');
    return state.questions.componentEl;
  },

  setQuestionAnswer(key: AnswerKey, value: AnswerValue) {
    state.questions.answers[key] = value;
  },

  clearQuestionAnswer(key: AnswerKey) {
    delete state.questions.answers[key];
  },

  getQuestionAnswer(key: AnswerKey) {
    return state.questions.answers[key];
  },

  getQuestionAnswers() {
    return { ...state.questions.answers };
  },

  refreshVisibleQuestionAnswers(): void {
    state.questions.answers = {};

    this.getGroups().forEach((group) => {
      const visibleQuestions = group.questions.filter((question) => question.isVisible);
      visibleQuestions.forEach((question) => {
        const value = question.getValue();
        this.setQuestionAnswer(question.name, value);
      });
    });
  },

  getFirstQuestion(): QuestionItem | undefined {
    return state.questions.groups[0].questions[0];
  },

  getLastQuestion(): QuestionItem | undefined {
    return state.questions.groups.at(state.questions.currentGroupIndex)?.questions.at(-1);
  },

  resetQuestions() {
    state.questions.currentGroupIndex = 0;
    state.questions.currentQuestionIndex = 0;
    state.questions.answers = {};
    state.questions.groups.forEach((group) => group.reset());
    state.questions.componentEl = null;
  },

  setLCID(lcid: string) {
    state.lcid = lcid;
  },

  getLCID(): string | null {
    return state.lcid;
  },

  getState() {
    return { ...state };
  },
};
