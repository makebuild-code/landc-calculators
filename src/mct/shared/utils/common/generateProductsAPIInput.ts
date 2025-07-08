import { FILTERS_CONFIG } from '$mct/config';
import { MCTManager } from '$mct/manager';
import {
  MortgageTypeENUM,
  PropertyTypeENUM,
  SapValueENUM,
  SchemePeriodsENUM,
  SchemePurposeENUM,
  SchemeTypesENUM,
  SortColumnENUM,
  type Answers,
  type CheckboxList,
  type Features,
  type ProductsOptions,
  type ProductsRequest,
} from '$mct/types';
import { getEnumKey } from './getEnumKey';

export const generateProductsAPIInput = (answers: Answers, options: ProductsOptions = {}): ProductsRequest => {
  // Handle all values coming from the answers
  const { PropertyValue, DepositAmount } = answers as { PropertyValue: number; DepositAmount: number };
  const RepaymentValue = (answers.RepaymentValue as number) ?? PropertyValue - DepositAmount;

  const PropertyType =
    PropertyTypeENUM[answers.PropertyType as keyof typeof PropertyTypeENUM] ?? PropertyTypeENUM.House;
  const MortgageType = MortgageTypeENUM[answers.ResiBtl as keyof typeof MortgageTypeENUM];
  const InterestOnlyValue = (answers.InterestOnlyValue as number) ?? 0;
  const TermYears = answers.MortgageLength as number;
  const SchemePurpose = SchemePurposeENUM[answers.PurchRemo as keyof typeof SchemePurposeENUM];

  const SchemePeriodsValue = answers.SchemePeriods;
  const SchemePeriods = [SchemePeriodsENUM[SchemePeriodsValue as keyof typeof SchemePeriodsENUM]];

  const SchemeTypesValue = answers.SchemeTypes as CheckboxList;
  const SchemeTypes = SchemeTypesValue.map((type) => SchemeTypesENUM[type as keyof typeof SchemeTypesENUM]);

  console.log('answers.NewBuild: ', answers.NewBuild);
  console.log('options.NewBuild: ', options.NewBuild);
  console.log('answers.SapValue: ', answers.SapValue);
  console.log('options.SapValue: ', options.SapValue);

  const NewBuild =
    answers.NewBuild === 'true'
      ? true
      : answers.NewBuild === 'false'
        ? false
        : options.NewBuild
          ? options.NewBuild
          : FILTERS_CONFIG.NewBuild === 'true'
            ? true
            : false;

  const SapValue = answers.SapValue
    ? SapValueENUM[answers.SapValue as keyof typeof SapValueENUM]
    : options.SapValue
      ? options.SapValue
      : FILTERS_CONFIG.SapValue === getEnumKey(SapValueENUM, SapValueENUM.No)
        ? SapValueENUM.No
        : SapValueENUM.Yes;

  // Handle all values coming from the options
  const NumberOfResults = options.numberOfResults ?? 1;
  const SortColumn = options.sortColumn ?? SortColumnENUM.Rate;

  const Features: Features = {};
  if (options.HelpToBuy) Features.HelpToBuy = true;
  if (options.Offset) Features.Offset = true;
  if (options.EarlyRepaymentCharge) Features.EarlyRepaymentCharge = true;
  if (NewBuild !== undefined) Features.NewBuild = NewBuild;

  const input: ProductsRequest = {
    PropertyValue,
    RepaymentValue,
    PropertyType,
    MortgageType,
    InterestOnlyValue,
    TermYears,
    SchemePurpose,
    SchemePeriods,
    SchemeTypes,
    NumberOfResults,
    SortColumn,
    Features,
    SapValue,
  };

  MCTManager.setCalculations({
    RepaymentValue,
    InterestOnlyValue,
    // SapValue,
  });

  return input;
};
