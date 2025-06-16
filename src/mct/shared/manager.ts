import type { QuestionGroup } from '../stages/questions/QuestionGroup';
import type { QuestionItem } from '../stages/questions/QuestionItem';

interface State {
  questions: {
    currentGroupIndex: number;
    currentQuestionIndex: number;
    answers: Record<string, string>;
    groups: QuestionGroup[];
  };
}

const state: State = {
  questions: {
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

  saveAnswer(key: string, value: string) {
    state.questions.answers[key] = value;
  },

  getAnswer(key: string) {
    return state.questions.answers[key];
  },

  getGroups() {
    return state.questions.groups;
  },

  getFirstQuestion(): QuestionItem | undefined {
    return state.questions.groups[0].questions[0];
  },

  getLastQuestion(): QuestionItem | undefined {
    return state.questions.groups.at(-1)?.questions.at(-1);
  },

  nextGroup() {
    state.questions.currentGroupIndex += 1;
    const next = state.questions.groups[state.questions.currentGroupIndex];
    if (next) next.show();
  },

  resetJourney() {
    state.questions.currentGroupIndex = 0;
    state.questions.currentQuestionIndex = 0;
    state.questions.answers = {};
    state.questions.groups.forEach((group) => group.reset());
  },

  getState() {
    return { ...state };
  },
};
