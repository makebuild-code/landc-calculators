import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

import { initQuestions } from '../stages/questions';
import { generateLCID } from './api/generateLCID';
import { mctAttr } from './constants';
import type { AnswerKey, Answers, AnswerValue, StageName } from './types';

interface Stage {
  id: StageName;
  show: () => void;
  hide: () => void;
  init: () => void;
}

const stages: Record<string, Stage> = {};

interface DOM {
  mctComponent: HTMLElement | null;
  stages: Partial<Record<StageName, HTMLElement>>;
}

const dom: DOM = {
  mctComponent: null,
  stages: {},
};

export interface AppState {
  lcid: string | null;
  icid: string | null;
  currentStageId: string | null;
  answers: Answers;
}

const state: AppState = {
  lcid: null,
  icid: null,
  currentStageId: null,
  answers: {},
};

const MCT_ANSWERS_STORAGE_KEY = 'mct_data';

interface MCTData {
  lcid?: string | null;
  icid?: string | null;
  answers?: Answers;
}

export const MCTManager = {
  initDOM(): DOM {
    dom.mctComponent = queryElement(`[${mctAttr.mct}="component"]`) as HTMLElement;
    if (!dom.mctComponent) throw new Error('MCT component not found');

    const stageElements = queryElements(`[${mctAttr.stage}]`, dom.mctComponent);
    stageElements.forEach((stage) => {
      const name = stage.getAttribute(mctAttr.stage);
      if (name) dom.stages[name as StageName] = stage as HTMLElement;
    });

    return dom;
  },

  getComponent() {
    if (!dom.mctComponent) throw new Error('MCT component not initialised');
    return dom.mctComponent;
  },

  getStage(name: StageName) {
    if (!dom.stages) throw new Error('Stages not initialised');
    const stage = dom.stages[name];
    if (!stage) throw new Error(`Stage '${name}' not found`);
    return dom.stages[name];
  },

  async preInit() {
    try {
      const lcid = await generateLCID();
      this.setLCID(lcid);
    } catch {
      console.error('Failed to generate LCID');
    }
  },

  route() {
    const mainQuestions = this.getStage('questions') as HTMLElement;
    initQuestions(mainQuestions, {
      mode: 'main',
      prefill: false,
    });
  },

  registerStage(stage: Stage) {
    stages[stage.id] = stage;
  },

  goToStage(stageId: string) {
    if (state.currentStageId && stages[state.currentStageId]) {
      stages[state.currentStageId].hide();
    }
    state.currentStageId = stageId;
    if (stages[stageId]) {
      stages[stageId].init?.();
      stages[stageId].show();
    }
  },

  getPersistedData(): MCTData {
    const stored = localStorage.getItem(MCT_ANSWERS_STORAGE_KEY);
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  },

  setPersistedData(data: MCTData) {
    localStorage.setItem(MCT_ANSWERS_STORAGE_KEY, JSON.stringify(data));
  },

  setLCID(lcid: string) {
    const data = this.getPersistedData();
    data.lcid = lcid;
    this.setPersistedData(data);
    state.lcid = lcid;
  },

  getLCID(): string | null {
    return state.lcid;
  },

  setICID(icid: string) {
    const data = this.getPersistedData();
    data.icid = icid;
    this.setPersistedData(data);
    state.icid = icid;
  },

  getICID(): string | null {
    return state.icid;
  },

  setAnswer(key: AnswerKey, value: AnswerValue) {
    const data = this.getPersistedData();
    if (!data.answers) data.answers = {};
    data.answers[key] = value;
    this.setPersistedData(data);
    state.answers[key] = value;

    console.log(this.getPersistedData());
    console.log(state.answers);
  },

  getAnswer(key: AnswerKey): AnswerValue | null {
    return state.answers?.[key];
  },

  getAnswers(): Answers {
    return { ...state.answers };
  },

  clearAnswer(key: AnswerKey) {
    const data = this.getPersistedData();
    delete data.answers?.[key];
    this.setPersistedData(data);
    delete state.answers[key];

    console.log(this.getPersistedData());
    console.log(state.answers);
  },

  clearAnswers() {
    const data = this.getPersistedData();
    data.answers = {};
    this.setPersistedData(data);
    state.answers = {};
  },

  initFromStorage() {
    const data = this.getPersistedData();
    state.lcid = data.lcid ?? null;
    state.icid = data.icid ?? null;
    state.answers = data.answers ?? {};
  },

  getState(): AppState {
    return { ...state };
  },
};
