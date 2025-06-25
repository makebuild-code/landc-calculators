import { getFromCookie } from '$utils/getFromCookie';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';
import { setToCookie } from '$utils/setToCookie';

import { initForm } from '../stages/form';
import { generateLCID } from './api/generateLCID';
import { mctAttr } from './constants';
import type { AnswerKey, Answers, AnswerValue, StageID } from './types';

interface Stage {
  id: StageID;
  init: () => void;
  show: () => void;
  hide: () => void;
}

const stages: Record<string, Stage> = {};

interface DOM {
  mctComponent: HTMLElement | null;
  stages: Partial<Record<StageID, HTMLElement>>;
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
  /**
   * @plan
   *
   * - generate new LCID
   * - save to the data and cookies
   */
  start() {
    this.initDOM();
    this.initICID();
    this.initLCID();

    console.log(dom);
  },

  initDOM(): DOM {
    dom.mctComponent = queryElement(`[${mctAttr.mct}="component"]`) as HTMLElement;
    if (!dom.mctComponent) throw new Error('MCT component not found');

    const stageElements = queryElements(`[${mctAttr.stage}]`, dom.mctComponent);
    stageElements.forEach((stage) => {
      const name = stage.getAttribute(mctAttr.stage);
      if (name) dom.stages[name as StageID] = stage as HTMLElement;
    });

    return dom;
  },

  initICID() {
    const icid = getFromCookie('ICID');
    this.setICID(icid ?? 'default');
  },

  async initLCID() {
    const currentLCID = getFromCookie('LCID');
    this.setLCID(currentLCID ?? null);

    try {
      const lcid = await generateLCID();
      this.setLCID(lcid);
    } catch {
      console.error('Failed to generate LCID');
    }
  },

  getComponent() {
    if (!dom.mctComponent) throw new Error('MCT component not initialised');
    return dom.mctComponent;
  },

  getStage(name: StageID) {
    if (!dom.stages) throw new Error('Stages not initialised');
    const stage = dom.stages[name];
    if (!stage) throw new Error(`Stage '${name}' not found`);
    return dom.stages[name];
  },

  route() {
    const mainQuestions = this.getStage('questions') as HTMLElement;
    initForm(mainQuestions, {
      mode: 'main',
      prefill: false,
    });
  },

  registerStage(stage: Stage) {
    stages[stage.id] = stage;
  },

  goToStage(stageId: StageID) {
    if (state.currentStageId && stages[state.currentStageId]) stages[state.currentStageId].hide();

    state.currentStageId = stageId;
    if (stages[stageId]) {
      stages[stageId].init();
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

  setICID(icid: string) {
    const data = this.getPersistedData();
    data.icid = icid;
    this.setPersistedData(data);
    state.icid = icid;
    setToCookie('ICID', icid);
  },

  getICID(): string | null {
    return state.icid;
  },

  setLCID(lcid: string | null) {
    const data = this.getPersistedData();
    data.lcid = lcid;
    this.setPersistedData(data);
    state.lcid = lcid;
    setToCookie('LCID', lcid ?? '');
  },

  getLCID(): string | null {
    return state.lcid;
  },

  setAnswer(key: AnswerKey, value: AnswerValue) {
    const data = this.getPersistedData();
    if (!data.answers) data.answers = {};
    data.answers[key] = value;
    this.setPersistedData(data);
    state.answers[key] = value;
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
