import { FILTERS_CONFIG } from '$mct/config';
import { MCTManager } from '$mct/manager';
import {
  CalculationKeysENUM,
  InputKeysENUM,
  MortgageTypeENUM,
  PropertyTypeENUM,
  PurchRemoENUM,
  RepaymentTypeENUM,
  ResiBtlENUM,
  SchemePeriodsENUM,
  SchemePurposeENUM,
  SchemeTypesENUM,
  SortColumnENUM,
  StageIDENUM,
  type InputsByEndOfForm,
  type ProductsOptions,
  type ProductsRequest,
  type ProductsRequestFeatures,
  type PurchInputs,
  type RemoInputs,
} from '$mct/types';
import { getEnumKey, getValueAsLandC } from '$mct/utils';

export const generateProductsAPIInput = (options: ProductsOptions = {}): ProductsRequest | null => {
  MCTManager.recalculate();
  const PurchRemo = getValueAsLandC(InputKeysENUM.PurchRemo);
  const answers =
    PurchRemo === PurchRemoENUM.Purchase
      ? (MCTManager.getAnswers() as InputsByEndOfForm & PurchInputs)
      : PurchRemo === PurchRemoENUM.Remortgage
        ? (MCTManager.getAnswers() as InputsByEndOfForm & RemoInputs)
        : null;

  if (!answers) return null;

  const { PropertyValue, ResiBtl, MortgageLength, RepaymentType } = answers;

  /**
   * Calc InterestOnlyValue and RepaymentValue
   *
   * if RepaymentType is Part & part:
   * RepaymentValue = PropertyValue - DepositAmount - InterestOnlyValue
   *
   * else if InterestOnly
   * RepaymentValue = 0
   * InterestOnlyValue = PropertyValue - DepositAmount
   */

  let InterestOnlyValue = answers[InputKeysENUM.InterestOnlyValue] ?? 0;
  let RepaymentValue = 0;

  if (PurchRemo === PurchRemoENUM.Purchase) {
    const DepositAmount = (answers as InputsByEndOfForm & PurchInputs)[InputKeysENUM.DepositAmount];

    if (RepaymentType === getEnumKey(RepaymentTypeENUM, RepaymentTypeENUM.Repayment)) {
      RepaymentValue = PropertyValue - DepositAmount;
      InterestOnlyValue = 0;
    } else if (RepaymentType === getEnumKey(RepaymentTypeENUM, RepaymentTypeENUM.InterestOnly)) {
      InterestOnlyValue = PropertyValue - DepositAmount;
      RepaymentValue = 0;
    } else if (RepaymentType === getEnumKey(RepaymentTypeENUM, RepaymentTypeENUM.Both)) {
      RepaymentValue = PropertyValue - DepositAmount - InterestOnlyValue;
    }
  } else if (PurchRemo === PurchRemoENUM.Remortgage) {
    const BorrowAmount = (answers as InputsByEndOfForm & RemoInputs)[InputKeysENUM.BorrowAmount];

    if (RepaymentType === getEnumKey(RepaymentTypeENUM, RepaymentTypeENUM.Repayment)) {
      RepaymentValue = BorrowAmount;
      InterestOnlyValue = 0;
    } else if (RepaymentType === getEnumKey(RepaymentTypeENUM, RepaymentTypeENUM.InterestOnly)) {
      InterestOnlyValue = BorrowAmount;
      RepaymentValue = 0;
    } else if (RepaymentType === getEnumKey(RepaymentTypeENUM, RepaymentTypeENUM.Both)) {
      RepaymentValue = BorrowAmount - InterestOnlyValue;
    }
  }

  // No question exists for PropertyType, so we use the default value
  const PropertyType = PropertyTypeENUM.House;

  // Format required ProductsRequest values
  const MortgageType =
    ResiBtl === getEnumKey(ResiBtlENUM, ResiBtlENUM.Residential) ? MortgageTypeENUM.Residential : MortgageTypeENUM.Btl;
  const TermYears = MortgageLength;
  const SchemePurpose =
    PurchRemo === PurchRemoENUM.Purchase ? SchemePurposeENUM.Purchase : SchemePurposeENUM.Remortgage;
  // const SchemePeriods = getValueAsLandC(InputKeysENUM.SchemePeriods) as SchemePeriodsENUM; // Make sure this returns non-undefined (should be fine)
  const SchemePeriods = JSON.parse(getValueAsLandC(InputKeysENUM.SchemePeriods) as SchemePeriodsENUM); // This returns an array as expected
  const SchemeTypes = JSON.parse(getValueAsLandC(InputKeysENUM.SchemeTypes) as SchemeTypesENUM); // This returns an array as expected

  const currentStage = MCTManager.getCurrentStage();
  const filters = MCTManager.getFilters();
  const miscValues = currentStage === StageIDENUM.Questions ? options : { ...options, ...filters };
  const SortColumn = miscValues.SortColumn ?? SortColumnENUM.Rate;
  const NumberOfResults = miscValues.NumberOfResults ?? 1;

  const endOfAnswersInput: ProductsRequest = {
    PropertyValue,
    RepaymentValue,
    InterestOnlyValue,
    PropertyType,
    MortgageType,
    TermYears,
    SchemePurpose,
    SchemePeriods,
    SchemeTypes,
    NumberOfResults,
    SortColumn,
  };

  // If remortgage, NewBuild is undefined. If in answers, use it. If not, use options. If not, use filters config.
  const NewBuild =
    SchemePurpose === SchemePurposeENUM.Remortgage
      ? undefined
      : miscValues.NewBuild === 'true'
        ? true
        : miscValues.NewBuild === 'false'
          ? false
          : FILTERS_CONFIG.NewBuild === 'true'
            ? true
            : false;

  // // First try options, then filters config
  // // @TODO: check that SapValue flag is being passed through options
  // const SapValue =
  //   options.SapValue ?? FILTERS_CONFIG.SapValue === getEnumKey(SapValueENUM, SapValueENUM.No)
  //     ? SapValueENUM.No
  //     : SapValueENUM.Yes;

  const Features: ProductsRequestFeatures = {};
  // if (options.HelpToBuy) Features.HelpToBuy = options.HelpToBuy;
  if (miscValues.Offset) Features.Offset = miscValues.Offset;
  if (miscValues.EarlyRepaymentCharge) Features.EarlyRepaymentCharge = !miscValues.EarlyRepaymentCharge;
  if (NewBuild !== undefined) Features.NewBuild = NewBuild;

  const IncludeRetention = MCTManager.getCalculation(CalculationKeysENUM.IncludeRetention) as boolean;

  const input: ProductsRequest = {
    ...endOfAnswersInput,
    SapValue: 100,
    Features,
    IncludeRetention,
  };

  console.log('[generateProductsAPIInput]', { endOfAnswersInput, input });

  return input;
};
