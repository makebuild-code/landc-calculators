import { FILTERS_CONFIG } from '$mct/config';
import { MCTManager } from '$mct/manager';
import {
  CalculationKeysENUM,
  InputKeysENUM,
  MortgageTypeENUM,
  PropertyTypeENUM,
  PurchRemoENUM,
  ResiBtlENUM,
  SapValueENUM,
  SchemePeriodsENUM,
  SchemePurposeENUM,
  SchemeTypesENUM,
  SortColumnENUM,
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

  const { PropertyValue, ResiBtl, MortgageLength } = answers;

  const RepaymentValue =
    PurchRemo === PurchRemoENUM.Purchase
      ? PropertyValue - (answers as InputsByEndOfForm & PurchInputs)[InputKeysENUM.DepositAmount]
      : answers.RepaymentValue;

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

  const NumberOfResults = options.numberOfResults ?? 1;
  const SortColumn = options.sortColumn ?? SortColumnENUM.Rate;

  const endOfAnswersInput: ProductsRequest = {
    PropertyValue,
    RepaymentValue,
    PropertyType,
    MortgageType,
    TermYears,
    SchemePurpose,
    SchemePeriods,
    SchemeTypes,
    NumberOfResults,
    SortColumn,
  };

  const InterestOnlyValue = (answers.InterestOnlyValue as number) ?? 0;

  // First try options, then filters config
  // @TODO: check that NewBuild flag is being passed through options
  const NewBuild = options.NewBuild ?? FILTERS_CONFIG.NewBuild === 'true' ? true : false;

  // First try options, then filters config
  // @TODO: check that SapValue flag is being passed through options
  const SapValue =
    options.SapValue ?? FILTERS_CONFIG.SapValue === getEnumKey(SapValueENUM, SapValueENUM.No)
      ? SapValueENUM.No
      : SapValueENUM.Yes;

  const Features: ProductsRequestFeatures = {};
  if (options.HelpToBuy) Features.HelpToBuy = options.HelpToBuy;
  if (options.Offset) Features.Offset = options.Offset;
  if (options.EarlyRepaymentCharge) Features.EarlyRepaymentCharge = options.EarlyRepaymentCharge;
  if (NewBuild !== undefined) Features.NewBuild = NewBuild;

  const IncludeRetention = (MCTManager.getCalculation(CalculationKeysENUM.IncludeRetention) as boolean) ?? false;

  const input: ProductsRequest = {
    ...endOfAnswersInput,
    InterestOnlyValue,
    SapValue,
    Features,
    IncludeRetention,
  };

  MCTManager.setCalculations({ RepaymentValue, InterestOnlyValue });

  console.log('input', input);
  console.log('endOfAnswersInput', endOfAnswersInput);

  return input;
};
