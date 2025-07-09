import type { StateManager } from './StateManager';
import {
  type AnswerKey,
  type Calculations,
  type CalculationKey,
  type CalculationValue,
  ReadinessToBuyENUM,
  CreditImpairedENUM,
  OfferAcceptedENUM,
  EndOfTermENUM,
  RemoChangeENUM,
} from '$mct/types';

export class CalculationManager {
  private stateManager: StateManager;
  private calculationRules: Map<AnswerKey, (answers: Record<string, any>) => Partial<Calculations>>;

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
    this.calculationRules.set('EndOfTerm', this.calculateIsProceedable);
    this.calculationRules.set('PropertyValue', this.calculateLoanToValue);
    this.calculationRules.set('DepositAmount', this.calculateLoanToValue);
    this.calculationRules.set('RemoChange', this.calculateIncludeRetention);
  }

  private subscribeToStateChanges(): void {
    this.stateManager.subscribe((event) => {
      if (event.changes.answers) this.runCalculations(event.currentState.answers);
    });
  }

  private runCalculations(answers: Record<string, any>): void {
    const newCalculations: Partial<Calculations> = {};

    // Run calculations for each rule
    this.calculationRules.forEach((calculationFn, answerKey) => {
      if (answers[answerKey] !== undefined) {
        const result = calculationFn(answers);
        Object.assign(newCalculations, result);
      }
    });

    // Update calculations in state - only include defined values
    const definedCalculations: Partial<Calculations> = {};
    Object.entries(newCalculations).forEach(([key, value]) => {
      if (value !== undefined) {
        definedCalculations[key as CalculationKey] = value;
      }
    });

    if (Object.keys(definedCalculations).length > 0) {
      this.stateManager.setCalculations(definedCalculations);
    }
  }

  private calculateIsProceedable(answers: Record<string, any>): Partial<Calculations> {
    const { ReadinessToBuy, CreditImpaired, EndOfTerm } = answers;
    if (!ReadinessToBuy && !CreditImpaired && !EndOfTerm) return {};

    let isProceedable = false;

    if (ReadinessToBuy && CreditImpaired) {
      // run logic
      const readinessToBuyValue = ReadinessToBuyENUM[ReadinessToBuy as keyof typeof ReadinessToBuyENUM];
      const readinessToBuyProceedable =
        readinessToBuyValue === ReadinessToBuyENUM.MadeAnOffer ||
        readinessToBuyValue === ReadinessToBuyENUM.OfferAccepted;

      const creditImpairedValue = CreditImpairedENUM[CreditImpaired as keyof typeof CreditImpairedENUM];
      const creditImpairedProceedable = creditImpairedValue === CreditImpairedENUM.No;

      isProceedable = readinessToBuyProceedable && creditImpairedProceedable;
    } else if (EndOfTerm) {
      const endOfTermValue = EndOfTermENUM[EndOfTerm as keyof typeof EndOfTermENUM];
      const endOfTermProceedable =
        endOfTermValue === EndOfTermENUM.WithinThreeMonths || endOfTermValue === EndOfTermENUM.ThreeToSixMonths;

      isProceedable = endOfTermProceedable;
    }

    console.log('🔄 isProceedable', isProceedable);

    return { isProceedable };
  }

  private calculateOfferAccepted(answers: Record<string, any>): Partial<Calculations> {
    const { ReadinessToBuy } = answers;
    if (!ReadinessToBuy) return {};

    const readinessToBuyValue = ReadinessToBuyENUM[ReadinessToBuy as keyof typeof ReadinessToBuyENUM];
    const isOfferAccepted = readinessToBuyValue === ReadinessToBuyENUM.OfferAccepted;
    const offerAccepted = isOfferAccepted ? OfferAcceptedENUM.Yes : OfferAcceptedENUM.No;

    return { offerAccepted };
  }

  private calculateLoanToValue(answers: Record<string, any>): Partial<Calculations> {
    const { PropertyValue, DepositAmount } = answers;
    if (!PropertyValue || !DepositAmount) return {};

    const LTV = ((PropertyValue - DepositAmount) / PropertyValue) * 100;
    return { LTV };
  }

  private calculateIncludeRetention(answers: Record<string, any>): Partial<Calculations> {
    const { RemoChange } = answers;
    if (!RemoChange) return {};

    const remoChangeValue = RemoChangeENUM[RemoChange as keyof typeof RemoChangeENUM];
    const IncludeRetention = remoChangeValue === RemoChangeENUM.NoChange;
    return { IncludeRetention };
  }

  // Public method to manually trigger calculations
  public recalculate(): void {
    const answers = this.stateManager.getAnswers();
    this.runCalculations(answers);
  }

  // Public method to add new calculation rules
  public addCalculationRule(
    answerKey: AnswerKey,
    calculationFn: (answers: Record<string, any>) => Partial<Calculations>
  ): void {
    this.calculationRules.set(answerKey, calculationFn);
  }

  // Public method to get available calculation keys
  public getAvailableCalculationKeys(): CalculationKey[] {
    return ['isProceedable', 'offerAccepted', 'LTV', 'IncludeRetention', 'RepaymentValue', 'InterestOnlyValue'];
  }

  // Public method to get calculation value with type safety
  public getCalculation<K extends CalculationKey>(key: K): CalculationValue | undefined {
    const calculations = this.stateManager.getCalculations();
    return calculations[key];
  }

  // Public method to check if a calculation exists
  public hasCalculation(key: CalculationKey): boolean {
    const calculations = this.stateManager.getCalculations();
    return key in calculations;
  }

  // Public method to set specific calculations
  public setCalculations(calculations: Partial<Calculations>): void {
    this.stateManager.setCalculations(calculations);
  }

  // Public method to set a single calculation
  public setCalculation<K extends CalculationKey>(key: K, value: CalculationValue): void {
    this.stateManager.setCalculations({ [key]: value });
  }
}
