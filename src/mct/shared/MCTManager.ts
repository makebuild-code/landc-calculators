import { queryElement } from '$utils/dom/queryElement';
import { queryElements } from '$utils/dom/queryelements';

import { initForm } from '../stages/form';
import type { MainFormManager } from '../stages/form/Manager_Main';
import { initResults } from '../stages/results';
import type { ResultsManager } from '../stages/results/Manager';

import { mctAttr } from './constants';
import { StageIDENUM } from '$mct/types';
import { StateManager } from './state';
import type { AnswerData, AnswerKey, Answers, AnswerValue, AppState, GoToStageOptions } from '$mct/types';
import { lcidAPI } from '$mct/api';

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

const stateManager = new StateManager();
export const MCTManager = {
  start() {
    this.initState();
    this.initDOM();
    this.initICID();
    this.initLCID();
    this.initStages();
    this.route();
  },

  initState() {
    console.log('🔄 Initializing hybrid MCTManager with new state management...');

    // Subscribe to state changes for debugging
    stateManager.subscribe((event) => {
      console.log('🔄 State changed via new manager:', {
        changes: event.changes,
        timestamp: new Date().toISOString(),
      });
    });

    stateManager.loadFromPersistence();
    stateManager.enableAutoPersistence();
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
    const icid = this.getICID();
    this.setICID(icid ?? 'default');
  },

  async initLCID() {
    const currentLCID = this.getLCID();
    const icid = this.getICID();

    try {
      // const lcid = await generateLCID(currentLCID, icid);
      const lcid = await lcidAPI.generate(currentLCID, icid);
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
    const currentStage = stageManagers[stateManager.getCurrentStage() as StageIDENUM] ?? null;
    if (currentStage) currentStage.hide();

    // update the state, init and show the next stage
    stateManager.setCurrentStage(stageId);
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

  setICID(icid: string) {
    stateManager.setICID(icid);
  },

  getICID(): string | null {
    return stateManager.getICID();
  },

  setLCID(lcid: string | null) {
    stateManager.setLCID(lcid);
  },

  getLCID(): string | null {
    return stateManager.getLCID();
  },

  setAnswer(answerData: AnswerData) {
    stateManager.setAnswer(answerData);
  },

  getAnswer(key: AnswerKey): AnswerValue | null {
    return stateManager.getAnswer(key);
  },

  setAnswers(answerDataArray: AnswerData[]) {
    stateManager.setAnswers(answerDataArray);
  },

  getAnswers(): Answers {
    return stateManager.getAnswers();
  },

  // clearAnswer(key: AnswerKey) {
  //   if (USE_NEW_STATE_MANAGEMENT.answers) {
  //     // Use new state management
  //     newStateManager.clearAnswer(key);
  //     // Keep legacy state in sync
  //     delete legacyState.answers[key];
  //   } else {
  //     // Use legacy approach
  //     const data = this.getPersistedData();
  //     delete data.answers?.[key];
  //     this.setPersistedData(data);
  //     delete legacyState.answers[key];
  //   }
  // },

  // clearAnswers() {
  //   if (USE_NEW_STATE_MANAGEMENT.answers) {
  //     // Use new state management
  //     newStateManager.clearAnswers();
  //     // Keep legacy state in sync
  //     legacyState.answers = {};
  //   } else {
  //     // Use legacy approach
  //     const data = this.getPersistedData();
  //     data.answers = {};
  //     this.setPersistedData(data);
  //     legacyState.answers = {};
  //   }
  // },

  // setProducts(products: Product[]) {
  //   stateManager.setProducts(products);
  // },

  // getProducts(): Product[] | null {
  //   return stateManager.getProducts();
  // },

  // setSummary(summary: SummaryInfo) {
  //   stateManager.setSummary(summary);
  // },

  // getSummary(): SummaryInfo | null {
  //   return stateManager.getSummary();
  // },

  getState(): AppState {
    return stateManager.getState();
  },
};
