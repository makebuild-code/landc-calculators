import type { QuestionGroup } from './QuestionGroup';
import type { QuestionItem } from './QuestionItem';
import type { Profile, ProfileName } from './types';
import { PROFILES } from '../../shared/constants';
import { sharedUtils } from 'src/mct/shared/utils';
import { simulateEvent } from '@finsweet/ts-utils';
import { prepareWrapper } from './utils/prepareWrapper';
import { queryElement } from '$utils/queryElement';

interface State {
  components: {
    element: HTMLElement | null;
    header: HTMLElement | null;
    stickyHeader: HTMLElement | null;
    profileSelect: HTMLSelectElement | null;
  };
  groups: QuestionGroup[];
  currentGroupIndex: number;
  currentQuestionIndex: number;
  answers: Record<AnswerKey, AnswerValue>;
  profile: Profile | null;
  optionRemoved: boolean;
}

export type AnswerKey = string;
export type AnswerValue = string | number | string[] | null;

const state: State = {
  components: {
    element: null,
    header: null,
    stickyHeader: null,
    profileSelect: null,
  },
  currentGroupIndex: 0,
  currentQuestionIndex: 0,
  answers: {},
  groups: [],
  profile: null,
  optionRemoved: false,
};

export const questionStageManager = {
  registerGroup(group: QuestionGroup) {
    state.groups.push(group);
  },

  getActiveGroupIndex(): number {
    return state.currentGroupIndex;
  },

  getActiveGroup(): QuestionGroup | undefined {
    return state.groups[this.getActiveGroupIndex()];
  },

  determineProfile(): Profile | null {
    const answers = this.getQuestionAnswers();
    const profile: Profile | undefined = PROFILES.find((profile) => {
      return Object.entries(profile.requirements).every(([key, value]) => answers[key] === value);
    });

    state.profile = profile ? profile : null;
    return profile ? profile : null;
  },

  findGroupByProfile(profile: Profile): QuestionGroup | undefined {
    return state.groups.find((group) => group.profileName === profile.name);
  },

  getPreviousGroupInSequence(): QuestionGroup | undefined {
    if (this.getActiveGroupIndex() <= 0) return undefined;
    return state.groups[0];
  },

  navigateToNextGroup() {
    const activeGroup = this.getActiveGroup();
    if (!activeGroup) return;

    if (this.getActiveGroupIndex() === 0) {
      const profile = this.determineProfile();
      if (!profile) return sharedUtils.logError('Could not determine profile');
      this.initialiseProfileSelect(profile.name);

      const nextGroup = this.findGroupByProfile(profile);
      if (!nextGroup) return sharedUtils.logError('No matching group found for profile:', profile);

      const nextGroupIndex = this.getGroups().indexOf(nextGroup);
      if (nextGroupIndex === -1) return sharedUtils.logError('Next group index not found');

      state.currentGroupIndex = nextGroupIndex;
      nextGroup.show();
      this.showHeader('sticky');
      prepareWrapper();
      const firstVisibleIndex = nextGroup.getNextVisibleIndex(-1);
      if (firstVisibleIndex < nextGroup.questions.length) {
        nextGroup.activeQuestionIndex = firstVisibleIndex;
        const firstQuestion = nextGroup.getActiveQuestion();
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
    if (!previousGroup) return sharedUtils.logError('No previous group found');

    const previousGroupIndex = state.groups.indexOf(previousGroup);
    if (previousGroupIndex === -1) return sharedUtils.logError('Previous group index not found');

    state.currentGroupIndex = previousGroupIndex;
    // previousGroup.show();
    this.showHeader('static');
    const lastVisibleIndex = previousGroup.getPrevVisibleIndex(previousGroup.questions.length);
    if (lastVisibleIndex >= 0) {
      previousGroup.activeQuestionIndex = lastVisibleIndex;
      previousGroup.activateQuestion(previousGroup.getActiveQuestion());
      return;
    }
  },

  getGroups() {
    return state.groups;
  },

  setQuestionsComponent(el: HTMLElement) {
    state.components.element = el;
  },

  setHeader(el: HTMLElement) {
    state.components.header = el;
  },

  setStickyHeader(el: HTMLElement) {
    state.components.stickyHeader = el;
  },

  setProfileSelect(el: HTMLSelectElement) {
    state.components.profileSelect = el;
  },

  initialiseProfileSelect(value: ProfileName) {
    const { profileSelect } = state.components;
    if (!profileSelect) return;

    profileSelect.value = value;
    simulateEvent(profileSelect, 'change');

    if (!state.optionRemoved) profileSelect.remove(0);
    state.optionRemoved = true;
  },

  showHeader(type: 'static' | 'sticky') {
    const { header, stickyHeader } = state.components;
    if (!header || !stickyHeader) return;
    if (type === 'static') {
      header.style.removeProperty('display');
      stickyHeader.style.display = 'none';
    } else if (type === 'sticky') {
      header.style.display = 'none';
      stickyHeader.style.removeProperty('display');
    }
  },

  getQuestionsComponent(): HTMLElement {
    if (!state.components.element) throw new Error('Component not set');
    return state.components.element;
  },

  setQuestionAnswer(key: AnswerKey, value: AnswerValue) {
    state.answers[key] = value;
  },

  clearQuestionAnswer(key: AnswerKey) {
    delete state.answers[key];
  },

  getQuestionAnswer(key: AnswerKey) {
    return state.answers[key];
  },

  getQuestionAnswers() {
    return { ...state.answers };
  },

  refreshVisibleQuestionAnswers(): void {
    state.answers = {};

    this.getGroups().forEach((group) => {
      const visibleQuestions = group.questions.filter((question) => question.isVisible);
      visibleQuestions.forEach((question) => {
        const value = question.getValue();
        this.setQuestionAnswer(question.name, value);
      });
    });
  },

  getFirstQuestion(): QuestionItem | undefined {
    return state.groups[0].questions[0];
  },

  getLastQuestion(): QuestionItem | undefined {
    return state.groups.at(state.currentGroupIndex)?.questions.at(-1);
  },

  resetQuestions() {
    state.currentGroupIndex = 0;
    state.currentQuestionIndex = 0;
    state.answers = {};
    state.groups.forEach((group) => group.reset());
    state.components.element = null;
  },

  getState() {
    return { ...state };
  },
};
