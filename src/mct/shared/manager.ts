import type { QuestionGroup } from '../stages/questions/QuestionGroup';
import type { QuestionItem } from '../stages/questions/QuestionItem';

interface State {
  questions: {
    currentGroupIndex: number;
    currentQuestionIndex: number;
    answers: Record<string, string>;
    groups: QuestionGroup[];
    componentEl: HTMLElement | null;
  };
}

const state: State = {
  questions: {
    componentEl: null,
    currentGroupIndex: 0,
    currentQuestionIndex: 0,
    answers: {},
    groups: [],
  },
};

export const manager = {
  registerGroup(group: QuestionGroup) {
    state.questions.groups.push(group);
  },

  getGroups() {
    return state.questions.groups;
  },

  setComponentEl(el: HTMLElement) {
    state.questions.componentEl = el;
  },

  getComponent(): HTMLElement {
    if (!state.questions.componentEl) throw new Error('Component not set');
    return state.questions.componentEl;
  },

  setAnswer(key: string, value: string) {
    state.questions.answers[key] = value;
  },

  getAnswer(key: string) {
    return state.questions.answers[key];
  },

  getAnswers() {
    return { ...state.questions.answers };
  },

  getFirstQuestion(): QuestionItem | undefined {
    return state.questions.groups[0].questions[0];
  },

  getLastQuestion(): QuestionItem | undefined {
    return state.questions.groups.at(state.questions.currentGroupIndex)?.questions.at(-1);
  },

  nextGroup() {
    state.questions.currentGroupIndex += 1;
    const next = state.questions.groups[state.questions.currentGroupIndex];
    if (next) next.show();
  },

  reset() {
    state.questions.currentGroupIndex = 0;
    state.questions.currentQuestionIndex = 0;
    state.questions.answers = {};
    state.questions.groups.forEach((group) => group.reset());
    state.questions.componentEl = null;
  },

  getState() {
    return { ...state };
  },
};
