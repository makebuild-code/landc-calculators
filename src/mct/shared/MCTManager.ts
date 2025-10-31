import { queryElement, queryElements } from '$utils/dom';

import { initForm, QuestionRegistry } from '../stages/form';
import type { MainFormManager } from '../stages/form/Manager_Main';
import { initResults } from '../stages/results';
import type { ResultsManager } from '../stages/results/Manager';
import { initAppointment } from '../stages/appointment';
import type { AppointmentManager } from '../stages/appointment/Manager';

import { lcidAPI, logUserEventsAPI } from '$mct/api';
import { EventBus } from '$mct/components';
import { DOM_CONFIG } from '$mct/config';
import { StateManager, CalculationManager, VisibilityManager } from '$mct/state';
import { MCTEventNames, StageIDENUM } from '$mct/types';
import {
  type InputData,
  type InputKey,
  type Inputs,
  type InputValue,
  type AppState,
  type Calculations,
  type CalculationValue,
  type GoToStageOptions,
  type ICID,
  type LCID,
  type LogUserEventCustom,
  type LogUserEventRequest,
  CalculationKeysENUM,
  type Booking,
  type EnquiryForm,
  type ProductsFilters,
} from '$mct/types';
import { directToBroker, getEnumKey, getValueAsLandC } from '$mct/utils';
import { dataLayer } from '$utils/analytics/dataLayer';
import { debugError, debugLog, debugWarn } from '$utils/debug';

const VERSION = '🔄 MCT DIST v2.0.0';
const attr = DOM_CONFIG.attributes;
const eventBus = EventBus.getInstance();

let isFirstStage: boolean = true;
interface Stage {
  id: StageIDENUM;
  start: (options?: any) => void;
  show: (scrollTo?: boolean) => void;
  hide: () => void;
}

const stageManagers: Record<string, Stage> = {};
const newStageManagers: Stage[] = [];

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
const questionRegistry = QuestionRegistry.getInstance();

export const MCTManager = {
  start() {
    const dom = this.initDOM();
    if (!dom) return;

    this.initState();
    this.initICID();
    this.initLCID();
    this.initStages();
    this.route();
  },

  initState() {
    debugLog('🔄 Initializing MCTManager...');
    debugLog(VERSION);

    // Subscribe to state changes for debugging
    stateManager.subscribe((event) => {
      debugLog('🔄 State changed via new manager:', {
        changes: event.changes,
        timestamp: new Date().toISOString(),
      });
    });

    stateManager.loadFromPersistence();
    stateManager.enableAutoPersistence();
  },

  initDOM(): DOM | null {
    dom.component = queryElement(`[${attr.component}="component"]`) as HTMLElement;
    if (!dom.component) return null;

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
    const newICID = !icid || icid === 'default' ? 'mct' : icid;
    this.setICID(newICID);
  },

  async initLCID() {
    const currentLCID = this.getLCID();
    const icid = this.getICID();

    try {
      const lcid = await lcidAPI.generate(currentLCID, icid);
      this.setLCID(lcid);
    } catch {
      debugError('Failed to generate LCID');
    }
  },

  initStages() {
    const mainForm = this.getStageDOM(StageIDENUM.Questions);
    const results = this.getStageDOM(StageIDENUM.Results);
    const appointment = this.getStageDOM(StageIDENUM.Appointment);

    if (mainForm) {
      const mainFormManager = initForm(mainForm);
      mainFormManager.hide();
      newStageManagers.push(mainFormManager);
      stageManagers[StageIDENUM.Questions] = mainFormManager as MainFormManager;
    }

    if (results) {
      const resultsManager = initResults(results);
      resultsManager.hide();
      newStageManagers.push(resultsManager);
      stageManagers[StageIDENUM.Results] = resultsManager as ResultsManager;
    }

    if (appointment) {
      const appointmentManager = initAppointment(appointment);
      appointmentManager.hide();
      newStageManagers.push(appointmentManager);
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

    if (newStageManagers.length === 0) {
      return debugError('🔄 No stage managers present');
    }

    debugLog('🔄 Available stages:', this.getAvailableStages());
    this.goToNextStage();

    eventBus.on(MCTEventNames.STAGE_COMPLETE, (event) => {
      debugLog('🔄 Stage complete', event);
      this.goToNextStage();
    });
  },

  getAvailableStages(): StageIDENUM[] {
    return newStageManagers.map((stage) => stage.id);
  },

  /**
   * @plan
   *
   * Scenarios:
   * 1. All stages are available
   * - show the next stage as usual
   *
   * 2. Questions and Appointment only
   * - Questions --> Appointment:
   *    - If proceedable, show `Appointment` stage
   *    - If not proceedable, direct user to broker (OEF)
   * 3. Appointment only
   * - no other stage will be found, do nothing
   */
  goToNextStage(options: GoToStageOptions = {}): boolean {
    // get current stage data
    const currentStageId = this.getCurrentStageId();
    const currentIndex = stateManager.getCurrentStageIndex();

    // get the stage and cancel if not found
    const nextStage = newStageManagers[currentIndex + 1];
    if (!nextStage) {
      debugWarn('🔄 No next stage');
      return false;
    }

    debugLog('Stage change:', {
      from: currentStageId,
      to: nextStage.id,
      isProceedable: this.getCalculation(CalculationKeysENUM.IsProceedable),
    });

    if (
      currentStageId === StageIDENUM.Questions &&
      nextStage.id === StageIDENUM.Appointment &&
      !this.getCalculation(CalculationKeysENUM.IsProceedable)
    ) {
      debugLog('🔄 Questions --> Appointment: Not proceedable');
      directToBroker();
      return true;
    }

    this.hideCurrentStage();
    this.startStage(nextStage, options);

    return true;
  },

  goToPrevStage(options: GoToStageOptions = {}): boolean {
    if (isFirstStage) return false;

    // get the stage and cancel if not found
    const prevStage = newStageManagers[stateManager.getCurrentStageIndex() - 1];
    if (!prevStage) {
      debugWarn('🔄 No previous stage');
      return false;
    }

    this.hideCurrentStage();
    this.startStage(prevStage, options);

    return true;
  },

  hideCurrentStage(): void {
    const currentIndex = stateManager.getCurrentStageIndex();
    const currentStage = newStageManagers[currentIndex];
    if (currentStage) currentStage.hide();
  },

  // Pass stage-specific options to the start method
  startStage(stage: Stage, options: GoToStageOptions = {}): void {
    stage.show(!isFirstStage);
    isFirstStage = false;
    this.setCurrentStage(stage);

    const stageOptions = options[stage.id];
    if (stageOptions) stage.start(stageOptions);
    else stage.start();

    // fire analytics event
    dataLayer('form_interaction', {
      event_category: 'MCTForm',
      event_label: `MCT_Show_${getEnumKey(StageIDENUM, stage.id)}`,
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

  getCurrentStageId(): StageIDENUM {
    return stateManager.getCurrentStageId();
  },

  getCurrentStage(): Stage | undefined {
    const currentStageId = this.getCurrentStageId();
    return newStageManagers.find((stage) => stage.id === currentStageId);
  },

  setCurrentStage(stage: Stage): void {
    stateManager.setCurrentStageId(stage.id);
    stateManager.setCurrentStageIndex(newStageManagers.indexOf(stage));
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

  overrideAnswers(answerDataArray: InputData[]): void {
    stateManager.overrideAnswers(answerDataArray);
  },

  getAnswers(context: 'main' | 'sidebar' = 'main'): Inputs {
    return context === 'main' ? stateManager.getAnswers() : questionRegistry.getValuesByPreset('sidebarSave');
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

  setFilter(filterData: InputData): void {
    stateManager.set('filters', { ...stateManager.get('filters'), [filterData.key]: filterData.value });
  },

  setFilters(filterDataArray: InputData[]): void {
    const filters = filterDataArray.reduce<Partial<Inputs>>((acc, filter) => {
      acc[filter.key] = filter.value as any;
      return acc;
    }, {} as Inputs);

    stateManager.set('filters', filters);
  },

  getFilters(): ProductsFilters {
    return stateManager.get('filters') as ProductsFilters;
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
      // debugLog('LogUserEvent: ', response);
    } catch (error) {
      debugError('error', error);
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
};
