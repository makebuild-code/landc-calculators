import type { StateManager } from './StateManager';
import {
  type InputKey,
  type Calculations,
  type CalculationKey,
  type CalculationValue,
  ReadinessToBuyENUM,
  CreditImpairedENUM,
  OfferAcceptedENUM,
  EndOfTermENUM,
  RemoChangeENUM,
  InputKeysENUM,
  CalculationKeysENUM,
} from '$mct/types';
import { getEnumValue } from '$mct/utils';

export class CalculationManager {
  private stateManager: StateManager;
  private calculationRules: Map<InputKey, (answers: Record<string, any>) => Partial<Calculations>>;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
    this.calculationRules = new Map();
    this.setupCalculationRules();
    this.subscribeToStateChanges();
  }

  private setupCalculationRules(): void {
    // Define calculation rules for specific input keys
    this.calculationRules.set(InputKeysENUM.ReadinessToBuy, this.readinessToBuy);
    this.calculationRules.set(InputKeysENUM.CreditImpaired, this.creditImpaired);
    this.calculationRules.set(InputKeysENUM.EndOfTerm, this.endOfTerm);
    this.calculationRules.set(InputKeysENUM.PropertyValue, this.propertyValue);
    this.calculationRules.set(InputKeysENUM.DepositAmount, this.depositAmount);
    this.calculationRules.set(InputKeysENUM.RemoChange, this.remoChange);
  }

  private subscribeToStateChanges(): void {
    this.stateManager.subscribe((event) => {
      if (event.changes.inputs) this.runCalculations(event.currentState.inputs);
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
        (definedCalculations as any)[key] = value;
      }
    });

    if (Object.keys(definedCalculations).length > 0) {
      this.stateManager.setCalculations(definedCalculations);
    }
  }

  private readinessToBuy = (answers: Record<string, any>): Partial<Calculations> => {
    return { ...this.calculateIsProceedable(answers), ...this.calculateOfferAccepted(answers) };
  };

  private creditImpaired = (answers: Record<string, any>): Partial<Calculations> => {
    return this.calculateIsProceedable(answers);
  };

  private endOfTerm = (answers: Record<string, any>): Partial<Calculations> => {
    return this.calculateIsProceedable(answers);
  };

  private propertyValue = (answers: Record<string, any>): Partial<Calculations> => {
    return this.calculateLoanToValue(answers);
  };

  private depositAmount = (answers: Record<string, any>): Partial<Calculations> => {
    return this.calculateLoanToValue(answers);
  };

  private remoChange = (answers: Record<string, any>): Partial<Calculations> => {
    return this.calculateIncludeRetention(answers);
  };

  /**
   * @returns { isProceedable: boolean } not proceedable if:
   * - ReadinessToBuy === Researching || Viewing
   * - CreditImpaired === Yes
   * - EndOfTerm === SixToTwelveMonths || TwelvePlusMonths
   */
  private calculateIsProceedable = (answers: Record<string, any>): Partial<Calculations> => {
    const { ReadinessToBuy, CreditImpaired, EndOfTerm } = answers;

    const ReadinessToBuyValue = getEnumValue(ReadinessToBuyENUM, ReadinessToBuy);
    const CreditImpairedValue = getEnumValue(CreditImpairedENUM, CreditImpaired);
    const EndOfTermValue = getEnumValue(EndOfTermENUM, EndOfTerm);

    let isProceedable = true;

    if (ReadinessToBuyValue === ReadinessToBuyENUM.Researching || ReadinessToBuyValue === ReadinessToBuyENUM.Viewing)
      isProceedable = false;
    if (CreditImpairedValue === CreditImpairedENUM.Yes) isProceedable = false;
    if (EndOfTermValue === EndOfTermENUM.SixToTwelveMonths || EndOfTermValue === EndOfTermENUM.TwelvePlusMonths)
      isProceedable = false;

    return {
      [CalculationKeysENUM.IsProceedable]: isProceedable,
    };
  };

  private calculateOfferAccepted = (answers: Record<string, any>): Partial<Calculations> => {
    const { ReadinessToBuy } = answers;
    if (!ReadinessToBuy) return {};

    const readinessToBuyValue = getEnumValue(ReadinessToBuyENUM, ReadinessToBuy);
    const isOfferAccepted = readinessToBuyValue === ReadinessToBuyENUM.OfferAccepted;
    const offerAccepted = isOfferAccepted ? OfferAcceptedENUM.Yes : OfferAcceptedENUM.No;

    return { [CalculationKeysENUM.OfferAccepted]: offerAccepted };
  };

  private calculateLoanToValue = (answers: Record<string, any>): Partial<Calculations> => {
    const { PropertyValue, DepositAmount } = answers;
    if (!PropertyValue || !DepositAmount) return {};

    const LTV = ((PropertyValue - DepositAmount) / PropertyValue) * 100;
    return { LTV };
  };

  private calculateIncludeRetention = (answers: Record<string, any>): Partial<Calculations> => {
    const { RemoChange } = answers;
    if (!RemoChange) return {};

    const remoChangeValue = getEnumValue(RemoChangeENUM, RemoChange);
    const IncludeRetention = remoChangeValue === RemoChangeENUM.NoChange;
    return { IncludeRetention };
  };

  // Public method to manually trigger calculations
  public recalculate(): void {
    const answers = this.stateManager.getAnswers();
    this.runCalculations(answers);
  }

  // Public method to add new calculation rules
  public addCalculationRule(
    answerKey: InputKey,
    calculationFn: (answers: Record<string, any>) => Partial<Calculations>
  ): void {
    this.calculationRules.set(answerKey, calculationFn);
  }

  // Public method to get available calculation keys
  public getAvailableCalculationKeys(): (keyof Calculations)[] {
    return [
      CalculationKeysENUM.IsProceedable,
      CalculationKeysENUM.OfferAccepted,
      CalculationKeysENUM.LTV,
      CalculationKeysENUM.IncludeRetention,
      CalculationKeysENUM.RepaymentValue,
      CalculationKeysENUM.InterestOnlyValue,
    ];
  }

  // Public method to get calculation value with type safety
  public getCalculation(key: CalculationKeysENUM): CalculationValue | undefined {
    const calculations = this.stateManager.getCalculations();
    return calculations[key];
  }

  // // Public method to get calculation value with type safety
  // public getCalculation<K extends keyof Calculations>(key: K): Calculations[K] | undefined {
  //   const calculations = this.stateManager.getCalculations();
  //   return calculations[key];
  // }

  // Public method to check if a calculation exists
  public hasCalculation(key: CalculationKeysENUM): boolean {
    const calculations = this.stateManager.getCalculations();
    return key in calculations;
  }

  // Public method to set specific calculations
  public setCalculations(calculations: Partial<Calculations>): void {
    this.stateManager.setCalculations(calculations);
  }

  // Public method to set a single calculation
  public setCalculation(key: CalculationKeysENUM, value: CalculationValue): void {
    this.stateManager.setCalculations({ [key]: value });
  }

  // // Public method to set a single calculation
  // public setCalculation<K extends CalculationKey>(key: K, value: CalculationValue): void {
  //   this.stateManager.setCalculations({ [key]: value });
  // }
}
