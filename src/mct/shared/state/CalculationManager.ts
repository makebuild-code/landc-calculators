import type { StateManager } from './StateManager';
import {
  type InputKey,
  type Calculations,
  type CalculationKey,
  type CalculationValue,
  ReadinessToBuyENUM,
  CreditImpairedENUM,
  OfferAcceptedENUM,
  DatePlanToRemoENUM,
  RemoChangeENUM,
  InputKeysENUM,
  CalculationKeysENUM,
  PurchRemoENUM,
  type Inputs,
} from '$mct/types';
import { getEnumKey, getEnumValue } from '$mct/utils';

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
    this.calculationRules.set(InputKeysENUM.PurchRemo, this.purchRemo);
    this.calculationRules.set(InputKeysENUM.ReadinessToBuy, this.readinessToBuy);
    this.calculationRules.set(InputKeysENUM.CreditImpaired, this.creditImpaired);
    this.calculationRules.set(InputKeysENUM.DatePlanToRemo, this.endOfTerm);
    this.calculationRules.set(InputKeysENUM.PropertyValue, this.propertyValue);
    this.calculationRules.set(InputKeysENUM.DepositAmount, this.depositAmount);
    this.calculationRules.set(InputKeysENUM.RemoChange, this.remoChange);
    this.calculationRules.set(InputKeysENUM.RepaymentValue, this.repaymentValue);
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

  private purchRemo = (answers: Inputs): Partial<Calculations> => {
    return { ...this.calculateLoanToValue(answers), ...this.calculateIsProceedable(answers) };
  };

  private readinessToBuy = (answers: Inputs): Partial<Calculations> => {
    return { ...this.calculateIsProceedable(answers), ...this.calculateOfferAccepted(answers) };
  };

  private creditImpaired = (answers: Inputs): Partial<Calculations> => {
    return this.calculateIsProceedable(answers);
  };

  private endOfTerm = (answers: Inputs): Partial<Calculations> => {
    return this.calculateIsProceedable(answers);
  };

  private propertyValue = (answers: Inputs): Partial<Calculations> => {
    return this.calculateLoanToValue(answers);
  };

  private depositAmount = (answers: Inputs): Partial<Calculations> => {
    return this.calculateLoanToValue(answers);
  };

  private remoChange = (answers: Inputs): Partial<Calculations> => {
    return this.calculateIncludeRetention(answers);
  };

  private repaymentValue = (answers: Inputs): Partial<Calculations> => {
    return this.calculateLoanToValue(answers);
  };

  /**
   * @returns { isProceedable: boolean } not proceedable if:
   * - ReadinessToBuy === Researching || Viewing
   * - CreditImpaired === Yes
   * - EndOfTerm === SixToTwelveMonths || TwelvePlusMonths
   */
  private calculateIsProceedable = (answers: Inputs): Partial<Calculations> => {
    const { PurchRemo, ReadinessToBuy, CreditImpaired, EndOfTerm } = answers;

    // Start with proceedable is true, remove it if any conditions are met
    let isProceedable = true;

    // If CreditImpaired doesn't exist or is 'Yes', isProceedable is false
    if (!CreditImpaired || CreditImpaired === getEnumKey(CreditImpairedENUM, CreditImpairedENUM.Yes)) {
      isProceedable = false;
    }

    // If PurchRemo is 'Purchase'
    if (PurchRemo === getEnumKey(PurchRemoENUM, PurchRemoENUM.Purchase)) {
      // If ReadinessToBuy doesn't exist or is 'Researching' or 'Viewing', isProceedable is false
      if (
        !ReadinessToBuy ||
        ReadinessToBuy === getEnumKey(ReadinessToBuyENUM, ReadinessToBuyENUM.Researching) ||
        ReadinessToBuy === getEnumKey(ReadinessToBuyENUM, ReadinessToBuyENUM.Viewing)
      ) {
        isProceedable = false;
      }

      // If PurchRemo is 'Remortgage'
    } else if (PurchRemo === getEnumKey(PurchRemoENUM, PurchRemoENUM.Remortgage)) {
      // If EndOfTerm doesn't exist or is 'TwelvePlusMonths', isProceedable is false
      if (!EndOfTerm || EndOfTerm === getEnumKey(DatePlanToRemoENUM, DatePlanToRemoENUM.TwelvePlusMonths)) {
        isProceedable = false;
      }
    }

    return {
      [CalculationKeysENUM.IsProceedable]: isProceedable,
    };
  };

  /**
   * @returns { OfferAccepted: boolean }
   * - If ReadinessToBuy is OfferAccepted, OfferAccepted = true
   * - If ReadinessToBuy is not OfferAccepted, OfferAccepted = false
   */
  private calculateOfferAccepted = (answers: Inputs): Partial<Calculations> => {
    const { ReadinessToBuy } = answers;
    if (!ReadinessToBuy) return { [CalculationKeysENUM.OfferAccepted]: OfferAcceptedENUM.No };

    const readinessToBuyValue = getEnumValue(ReadinessToBuyENUM, ReadinessToBuy);
    const isOfferAccepted = readinessToBuyValue === ReadinessToBuyENUM.OfferAccepted;
    const offerAccepted = isOfferAccepted ? OfferAcceptedENUM.Yes : OfferAcceptedENUM.No;

    return { [CalculationKeysENUM.OfferAccepted]: offerAccepted };
  };

  /**
   * @returns { LTV: number }
   * - If Purchase, LTV = (PropertyValue - DepositAmount) / PropertyValue
   * - If Remortgage, LTV = RepaymentValue / PropertyValue
   */
  private calculateLoanToValue = (answers: Inputs): Partial<Calculations> => {
    const { PurchRemo, PropertyValue, DepositAmount, RepaymentValue } = answers;
    if (!PurchRemo || !PropertyValue) return { LTV: undefined };

    let LTV = undefined;
    if (PurchRemo === getEnumKey(PurchRemoENUM, PurchRemoENUM.Purchase) && DepositAmount) {
      LTV = ((PropertyValue - DepositAmount) / PropertyValue) * 100;
    } else if (PurchRemo === getEnumKey(PurchRemoENUM, PurchRemoENUM.Remortgage) && RepaymentValue) {
      LTV = (RepaymentValue / PropertyValue) * 100;
    }

    return { LTV };
  };

  /**
   * @returns { IncludeRetention: boolean }
   * - If RemoChange is NoChange, IncludeRetention = true
   * - If RemoChange is Change, IncludeRetention = false
   */
  private calculateIncludeRetention = (answers: Inputs): Partial<Calculations> => {
    const { RemoChange } = answers;
    if (!RemoChange) return { IncludeRetention: false };

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
