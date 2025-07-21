import { queryElement, queryElements } from '$utils/dom';

import { initForm } from '../stages/form';
import type { MainFormManager } from '../stages/form/Manager_Main';
import { initResults } from '../stages/results';
import type { ResultsManager } from '../stages/results/Manager';
import { initAppointment } from '../stages/appointment';
import type { AppointmentManager } from '../stages/appointment/Manager';

import { lcidAPI, logUserEventsAPI } from '$mct/api';
import { globalEventBus, testComponents, testSimpleComponent } from '$mct/components';
import { DOM_CONFIG } from '$mct/config';
import { StateManager, CalculationManager, VisibilityManager } from '$mct/state';
import { FormEventNames, MCTEventNames, StageIDENUM } from '$mct/types';
import type {
  InputData,
  InputKey,
  Inputs,
  InputValue,
  AppState,
  CalculationKey,
  Calculations,
  CalculationValue,
  GoToStageOptions,
  ICID,
  LCID,
  LogUserEventCustom,
  LogUserEventRequest,
  CalculationKeysENUM,
  Booking,
  EnquiryForm,
} from '$mct/types';
import { getValueAsLandC } from '$mct/utils';

const attr = DOM_CONFIG.attributes;

let numberOfStagesShown: number = 0;
interface Stage {
  // id: StageIDENUM;
  init: (options?: any) => void;
  show: (scrollTo?: boolean) => void;
  hide: () => void;
  onEnter?: () => void;
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
const visibilityManager = new VisibilityManager(stateManager);

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
    console.log('FORCING DIST v8');

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

    // Initialize visibility manager for the component
    visibilityManager.initialize(dom.component);

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

    if (nextStage.onEnter) nextStage.onEnter();

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

  setAnswer(answerData: InputData) {
    stateManager.setAnswer(answerData);
  },

  getAnswer(key: InputKey): InputValue | undefined {
    return stateManager.getAnswer(key);
  },

  getAnswerAsLandC(key: InputKey): InputValue | undefined {
    return getValueAsLandC(key) as InputValue | undefined;
    // return getInputValueAsLandC(key) as InputValue | undefined;
  },

  setAnswers(answerDataArray: InputData[]) {
    stateManager.setAnswers(answerDataArray);
  },

  getAnswers(): Inputs {
    return stateManager.getAnswers();
  },

  getAnswersAsLandC(): Inputs {
    return Object.fromEntries(
      Object.entries(this.getAnswers()).map(([key, value]) => [key, getValueAsLandC(key as InputKey)])
      // Object.entries(this.getAnswers()).map(([key, value]) => [key, getInputValueAsLandC(key as InputKey)])
    );
  },

  setCalculation(key: CalculationKeysENUM, value: CalculationValue) {
    calculationManager.setCalculation(key, value);
  }, // TEST

  getCalculation(key: CalculationKeysENUM): CalculationValue | undefined {
    return calculationManager.getCalculation(key);
  }, // TEST

  setCalculations(calculations: Partial<Calculations>) {
    stateManager.setCalculations(calculations);
  },

  getCalculations(): Calculations {
    return stateManager.getCalculations();
  },

  recalculate(): void {
    calculationManager.recalculate();
  },

  setFilters(filterDataArray: InputData[]): void {
    const filters = filterDataArray.reduce<Partial<Inputs>>((acc, filter) => {
      acc[filter.key] = filter.value as any;
      return acc;
    }, {} as Inputs);

    stateManager.set('filters', filters);
  },

  getFilters(): Record<string, any> {
    return stateManager.get('filters');
  },

  setProduct(productId: number) {
    stateManager.set('product', productId);
  },

  getProduct(): number | null {
    return stateManager.get('product');
  },

  clearProduct(): void {
    stateManager.set('product', null);
  },

  setBooking(booking: Pick<Booking, 'bookingDate' | 'bookingStart' | 'bookingEnd'>): void {
    stateManager.set('booking', {
      ...booking,
      source: 'SYSTEM',
      bookingProfile: 'DEFAULT',
      bookingProfileId: 1,
    });
  },

  getBooking(): Booking | null {
    return stateManager.get('booking');
  },

  setFormInput(formData: Partial<EnquiryForm>): void {
    stateManager.set('form', { ...stateManager.get('form'), ...formData } as EnquiryForm);
  },

  clearFormInput(key: keyof EnquiryForm): void {
    const form = { ...stateManager.get('form') };
    delete form[key];
    stateManager.set('form', form as EnquiryForm);
  },

  getForm(): EnquiryForm | null {
    return stateManager.get('form');
  },

  clearForm(): void {
    stateManager.set('form', {} as EnquiryForm);
  },

  async logUserEvent(event: LogUserEventCustom): Promise<void> {
    const answers = this.getAnswersAsLandC();
    const FormValues: Record<string, string> = {};
    for (const [key, value] of Object.entries(answers)) {
      FormValues[key] = value != null ? String(value) : '';
    }

    const payload: LogUserEventRequest = {
      ...event,
      LCID: this.getLCID() as LCID,
      ICID: this.getICID() as ICID,
      FormValues,
      CreatedBy: 'MCT',
    };

    try {
      const response = await logUserEventsAPI.logEvent(payload);
      console.log('LogUserEvent: ', response);
    } catch (error) {
      console.error('error', error);
    }
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

  getStateManager(): StateManager {
    return stateManager;
  },

  getCalculationManager(): CalculationManager {
    return calculationManager;
  },

  getVisibilityManager(): VisibilityManager {
    return visibilityManager;
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
