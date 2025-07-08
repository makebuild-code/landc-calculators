import type { StateManager } from './StateManager';
import {
  type AppState,
  type AnswerKey,
  type Calculations,
  ReadinessToBuyENUM,
  CreditImpairedENUM,
  OfferAcceptedENUM,
} from '$mct/types';

export class CalculationManager {
  private stateManager: StateManager;
  private calculationRules: Map<AnswerKey, (answers: Record<string, any>) => Calculations>;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.calculationRules = new Map();
    this.setupCalculationRules();
    this.subscribeToStateChanges();
  }

  private setupCalculationRules(): void {
    // Define calculation rules for specific answer keys
    this.calculationRules.set('ReadinessToBuy', this.calculateOfferAccepted);
    this.calculationRules.set('ReadinessToBuy', this.calculateIsProceedable);
    this.calculationRules.set('CreditImpaired', this.calculateIsProceedable);
    this.calculationRules.set('PropertyValue', this.calculateLoanToValue);
    this.calculationRules.set('DepositAmount', this.calculateLoanToValue);
    // Add more rules as needed
  }

  private subscribeToStateChanges(): void {
    this.stateManager.subscribe((event) => {
      if (event.changes.answers) this.runCalculations(event.currentState.answers);
    });
  }

  private runCalculations(answers: Record<string, any>): void {
    const newCalculations: Calculations = {};

    // Run calculations for each rule
    this.calculationRules.forEach((calculationFn, answerKey) => {
      if (answers[answerKey] !== undefined) {
        const result = calculationFn(answers);
        Object.assign(newCalculations, result);
      }
    });

    // Update calculations in state
    if (Object.keys(newCalculations).length > 0) {
      this.stateManager.setCalculations(newCalculations);
    }
  }

  private calculateIsProceedable(answers: Record<string, any>): Calculations {
    const readinessToBuy = answers.ReadinessToBuy;
    const creditImpaired = answers.CreditImpaired;
    if (!readinessToBuy || !creditImpaired) return {};

    const readinessToBuyValue = ReadinessToBuyENUM[readinessToBuy as keyof typeof ReadinessToBuyENUM];
    const readinessToBuyProceedable =
      readinessToBuyValue === ReadinessToBuyENUM.MadeAnOffer ||
      readinessToBuyValue === ReadinessToBuyENUM.OfferAccepted;

    const creditImpairedValue = CreditImpairedENUM[creditImpaired as keyof typeof CreditImpairedENUM];
    const creditImpairedProceedable = creditImpairedValue === CreditImpairedENUM.No;

    const isProceedable = readinessToBuyProceedable && creditImpairedProceedable;

    return { isProceedable };
  }

  private calculateOfferAccepted(answers: Record<string, any>): Calculations {
    const readinessToBuy = answers.ReadinessToBuy;
    if (!readinessToBuy) return {};

    const readinessToBuyValue = ReadinessToBuyENUM[readinessToBuy as keyof typeof ReadinessToBuyENUM];
    const isOfferAccepted = readinessToBuyValue === ReadinessToBuyENUM.OfferAccepted;
    const offerAccepted = isOfferAccepted ? OfferAcceptedENUM.Yes : OfferAcceptedENUM.No;

    return { offerAccepted };
  }

  private calculateLoanToValue(answers: Record<string, any>): Calculations {
    const propertyValue = answers.PropertyValue;
    const depositAmount = answers.DepositAmount;
    if (!propertyValue || !depositAmount) return {};

    const LTV = ((propertyValue - depositAmount) / propertyValue) * 100;
    return { LTV };
  }

  // Public method to manually trigger calculations
  public recalculate(): void {
    const answers = this.stateManager.getAnswers();
    this.runCalculations(answers);
  }

  // Public method to add new calculation rules
  public addCalculationRule(answerKey: AnswerKey, calculationFn: (answers: Record<string, any>) => Calculations): void {
    this.calculationRules.set(answerKey, calculationFn);
  }
}
