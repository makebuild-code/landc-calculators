import { queryElement, queryElements } from '$utils/dom';

import { initForm } from '../stages/form';
import type { MainFormManager } from '../stages/form/Manager_Main';
import { initResults } from '../stages/results';
import type { ResultsManager } from '../stages/results/Manager';
import { initAppointment } from '../stages/appointment';
import type { AppointmentManager } from '../stages/appointment/Manager';

import { lcidAPI } from '$mct/api';
import { globalEventBus, testComponents, testSimpleComponent } from '$mct/components';
import { DOM_CONFIG } from '$mct/config';
import { StateManager, CalculationManager } from '$mct/state';
import { FormEventNames, MCTEventNames, StageIDENUM } from '$mct/types';
import type {
  AnswerData,
  AnswerKey,
  Answers,
  AnswerValue,
  AppState,
  Calculations,
  GoToStageOptions,
  ICID,
  LCID,
} from '$mct/types';
import type { BaseFormManager } from '../stages/form/NEW_Manager_Base';

const attr = DOM_CONFIG.attributes;

let numberOfStagesShown: number = 0;
interface Stage {
  // id: StageIDENUM;
  init: (options?: any) => void;
  show: (scrollTo?: boolean) => void;
  hide: () => void;
}

const stageManagers: Record<string, Stage> = {};

interface DOM {
  component: HTMLElement | null;
  stages: Partial<Record<StageIDENUM, HTMLElement>>;
}

const dom: DOM = {
  component: null,
  stages: {},
};

const stateManager = new StateManager();
const calculationManager = new CalculationManager(stateManager);

export const MCTManager = {
  start() {
    this.initState();
    this.initDOM();
    this.initICID();
    this.initLCID();
    this.initStages();
    this.route();
    this.removeInitialStyles();

    // Setup event bus for testing (optional)
    this.setupEventBusDebug();
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
    dom.component = queryElement(`[${attr.component}="component"]`) as HTMLElement;
    if (!dom.component) throw new Error('MCT component not found');

    const stages = queryElements(`[${attr.stage}]`, dom.component);
    stages.forEach((stage) => {
      const name = stage.getAttribute(attr.stage);
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
      const lcid = await lcidAPI.generate(currentLCID, icid);
      this.setLCID(lcid);
    } catch {
      console.error('Failed to generate LCID');
    }
  },

  initStages() {
    // const form = this.getStageDOM(StageIDENUM.Questions);
    // const results = this.getStageDOM(StageIDENUM.Results);
    // const appointment = this.getStageDOM(StageIDENUM.Appointment);

    // if (form) {
    //   const formManager = initForm({
    //     element: form,
    //     id: StageIDENUM.Questions,
    //     prefillFrom: 'none',
    //   });
    // }

    // if (results) {
    //   const resultsManager = initResults(results);
    //   stageManagers[StageIDENUM.Results] = resultsManager as ResultsManager;
    // }

    // if (appointment) {
    //   const appointmentManager = initAppointment(appointment);
    //   stageManagers[StageIDENUM.Appointment] = appointmentManager as AppointmentManager;
    // }

    const mainForm = this.getStageDOM(StageIDENUM.Questions);
    if (mainForm) {
      const mainFormManager = initForm(mainForm, {
        mode: 'main',
        prefill: false,
      });
      mainFormManager?.hide();
      stageManagers[StageIDENUM.Questions] = mainFormManager as MainFormManager;
    }

    const results = this.getStageDOM(StageIDENUM.Results);
    if (results) {
      const resultsManager = initResults(results);
      resultsManager?.hide();
      stageManagers[StageIDENUM.Results] = resultsManager as ResultsManager;
    }

    const appointment = this.getStageDOM(StageIDENUM.Appointment);
    if (appointment) {
      const appointmentManager = initAppointment(appointment);
      appointmentManager?.hide();
      stageManagers[StageIDENUM.Appointment] = appointmentManager as AppointmentManager;
    }
  },

  getComponentDOM() {
    if (!dom.component) throw new Error('MCT component not initialised');
    return dom.component;
  },

  getStageDOM(name: StageIDENUM): HTMLElement | undefined {
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

    const numberOfStages = Object.keys(stageManagers).length;
    if (numberOfStages === 0) {
      console.error('🔄 No stage managers initialised');
      return;
    } else if (numberOfStages === 1) {
      const onlyStage = Object.values(stageManagers)[0];
      if (onlyStage) {
        onlyStage.show(numberOfStagesShown !== 0);
        onlyStage.init();
        numberOfStagesShown += 1;
      }
    } else {
      this.goToStage(StageIDENUM.Questions);
    }

    // this.goToStage(StageIDENUM.Results);
  },

  goToStage(stageId: StageIDENUM, options: GoToStageOptions = {}): boolean {
    console.log('🔄 Going to stage', stageId);
    globalEventBus.emit(MCTEventNames.STAGE_GO_TO, { stageId });

    // get the stage and cancel if not found
    const nextStage = stageManagers[stageId] ?? null;
    if (!nextStage) return false;

    // hide the current stage
    const currentStage = stageManagers[stateManager.getCurrentStage() as StageIDENUM] ?? null;
    if (currentStage) currentStage.hide();

    // update the state, init and show the next stage
    stateManager.setCurrentStage(stageId);
    nextStage.show(numberOfStagesShown !== 0);
    numberOfStagesShown += 1;

    // Pass stage-specific options to the init method
    const stageOptions = options[stageId];
    if (stageOptions && typeof nextStage.init === 'function') {
      nextStage.init(stageOptions);
    } else {
      nextStage.init();
    }

    return true;
  },

  removeInitialStyles() {
    const elements = queryElements(`[${attr.initial}]`, this.getComponentDOM());
    console.log('🔄 Removing initial styles', elements);
    elements.forEach((element) => {
      element.removeAttribute(attr.initial);
    });
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

  setCalculations(calculations: Calculations) {
    stateManager.setCalculations(calculations);
  },

  getCalculations(): Calculations {
    return stateManager.getCalculations();
  },

  setMortgageId(mortgageId: number | null) {
    stateManager.set('mortgageId', mortgageId);
  },

  getMortgageId(): number | null {
    return stateManager.get('mortgageId');
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

  getCalculationManager(): CalculationManager {
    return calculationManager;
  },

  setupEventBusDebug() {
    if (typeof window === 'undefined') return;

    // Make event bus available globally for testing
    (window as any).globalEventBus = globalEventBus;

    // Add some test event listeners
    globalEventBus.on(FormEventNames.QUESTION_CHANGED, (payload) => {
      console.log('📡 MCT Event: Question changed', payload);
    });

    globalEventBus.on(FormEventNames.NAVIGATION_UPDATE, (payload) => {
      console.log('📡 MCT Event: Navigation updated', payload);
    });

    // Make component testing available
    (window as any).testComponents = testComponents;
    (window as any).testSimpleComponent = testSimpleComponent;

    console.log('🔧 Event Bus & Component Debug Tools Available!');
    console.log('- globalEventBus - Access the global event bus');
    console.log('- globalEventBus.emit("form:question:changed", {...}) - Test events');
    console.log('- testSimpleComponent() - Test simple component (recommended first)');
    console.log('- testComponents() - Test full component system');
  },
};
