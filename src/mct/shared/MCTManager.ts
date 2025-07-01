import { getFromCookie } from '$utils/getFromCookie';
import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';
import { setToCookie } from '$utils/setToCookie';

import { initForm } from '../stages/form';
import type { FormManager, MainFormManager } from '../stages/form/Manager';
import { initResults } from '../stages/results';
import type { ResultsManager } from '../stages/results/Manager';
import { generateLCID } from './api/generateLCID';
import type { Product, ProductsResponse, SummaryInfo } from './api/types/fetchProducts';
import { mctAttr } from './constants';
import type { AnswerKey, Answers, AnswerValue, StageID } from './types';

interface Stage {
  id: StageID;
  init: () => void;
  show: () => void;
  hide: () => void;
}

const stageManagers: Record<string, Stage> = {};

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

  initStages() {
    const mainForm = this.getStageDOM('questions') as HTMLElement;
    const mainFormManager = initForm(mainForm, {
      mode: 'main',
      prefill: false,
    });
    mainFormManager?.hide();

    const results = this.getStageDOM('results') as HTMLElement;
    const resultsManager = initResults(results);
    resultsManager?.hide();

    stageManagers['questions'] = mainFormManager as MainFormManager;
    stageManagers['results'] = resultsManager as ResultsManager;
  },

  getComponentDOM() {
    if (!dom.mctComponent) throw new Error('MCT component not initialised');
    return dom.mctComponent;
  },

  getStageDOM(name: StageID) {
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

    // this.goToStage('questions');
    this.goToStage('results');
  },

  goToStage(stageId: StageID): boolean {
    // get the stage and cancel if not found
    const nextStage = stageManagers[stageId] ?? null;
    if (!nextStage) return false;

    // hide the current stage
    const currentStage = stageManagers[state.currentStageId as StageID] ?? null;
    if (currentStage) currentStage.hide();

    // update the state, init and show the next stage
    state.currentStageId = stageId;
    nextStage.show();
    nextStage.init();
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
