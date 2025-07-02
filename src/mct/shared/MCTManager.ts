import { getFromCookie } from '$utils/storage/getFromCookie';
import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';
import { setToCookie } from '$utils/storage/setToCookie';

import { initForm } from '../stages/form';
import type { MainFormManager } from '../stages/form/Manager_Main';
import { initResults } from '../stages/results';
import type { ResultsManager } from '../stages/results/Manager';

import { mctAttr } from './constants';
import type { AnswerKey, Answers, AnswerValue, GoToStageOptions, Product, SummaryInfo } from '$mct/types';
import { StageIDENUM } from '$mct/types';
import { generateLCID } from '$mct/api';

interface Stage {
  id: StageIDENUM;
  init: (options?: any) => void;
  show: () => void;
  hide: () => void;
}

const stageManagers: Record<string, Stage> = {};

interface DOM {
  mctComponent: HTMLElement | null;
  stages: Partial<Record<StageIDENUM, HTMLElement>>;
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
  summary: SummaryInfo | null;
  products: Product[] | null;
}

const state: AppState = {
  lcid: null,
  icid: null,
  currentStageId: null,
  answers: {},
  summary: null,
  products: null,
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
    this.initStages();
    this.route();
  },

  initDOM(): DOM {
    dom.mctComponent = queryElement(`[${mctAttr.mct}="component"]`) as HTMLElement;
    if (!dom.mctComponent) throw new Error('MCT component not found');

    const stageElements = queryElements(`[${mctAttr.stage}]`, dom.mctComponent);
    stageElements.forEach((stage) => {
      const name = stage.getAttribute(mctAttr.stage);
      if (name) dom.stages[name as StageIDENUM] = stage as HTMLElement;
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

  initStages() {
    const mainForm = this.getStageDOM(StageIDENUM.Questions) as HTMLElement;
    const mainFormManager = initForm(mainForm, {
      mode: 'main',
      prefill: false,
    });
    mainFormManager?.hide();

    const results = this.getStageDOM(StageIDENUM.Results) as HTMLElement;
    const resultsManager = initResults(results);
    resultsManager?.hide();

    stageManagers[StageIDENUM.Questions] = mainFormManager as MainFormManager;
    stageManagers[StageIDENUM.Results] = resultsManager as ResultsManager;
  },

  getComponentDOM() {
    if (!dom.mctComponent) throw new Error('MCT component not initialised');
    return dom.mctComponent;
  },

  getStageDOM(name: StageIDENUM) {
    if (!dom.stages) throw new Error('Stages not initialised');
    const stage = dom.stages[name];
    if (!stage) throw new Error(`Stage '${name}' not found`);
    return dom.stages[name];
  },

  route() {
    /**
     * @plan
     * - need to check local storage on load and populate the state
     * - if user came from another page still show the form?
     * - if user came from another page, prefill the results? Maybe click a button to do so?
     * - populate the customer-identifier? populate the whole form?
     *
     * - once questions are done, init the results
     */

    // const params = new URLSearchParams(window.location.search);
    // const profile = params.get(parameters.profile) as ProfileName | undefined;

    // if (profile) this.goToStage('questions', { questions: { profile } });

    // if (profile === 'residential-purchase') {
    //   this.goToStage('results');
    // } else {
    //   this.goToStage('questions');
    // }

    this.goToStage(StageIDENUM.Questions);
    // this.goToStage(StageIDENUM.Results);
  },

  goToStage(stageId: StageIDENUM, options: GoToStageOptions = {}): boolean {
    // get the stage and cancel if not found
    const nextStage = stageManagers[stageId] ?? null;
    if (!nextStage) return false;

    // hide the current stage
    const currentStage = stageManagers[state.currentStageId as StageIDENUM] ?? null;
    if (currentStage) currentStage.hide();

    // update the state, init and show the next stage
    state.currentStageId = stageId;
    nextStage.show();

    // Pass stage-specific options to the init method
    const stageOptions = options[stageId];
    if (stageOptions && typeof nextStage.init === 'function') {
      nextStage.init(stageOptions);
    } else {
      nextStage.init();
    }

    return true;
  },

  getPersistedData(): MCTData {
    const stored = localStorage.getItem(MCT_ANSWERS_STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
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

  setProducts(products: Product[]) {
    state.products = products;
  },

  getProducts(): Product[] | null {
    return state.products;
  },

  setSummary(summary: SummaryInfo) {
    state.summary = summary;
  },

  getSummary(): SummaryInfo | null {
    return state.summary;
  },

  getState(): AppState {
    return { ...state };
  },
};
