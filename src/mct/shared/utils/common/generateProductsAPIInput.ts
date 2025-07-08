import { MCTManager } from '$mct/manager';
import {
  MortgageTypeENUM,
  PropertyTypeENUM,
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

  // Handle all values coming from the options
  const NumberOfResults = options.numberOfResults ?? 1;
  const SortColumn = options.sortColumn ?? SortColumnENUM.Rate;
  const SapValue = options.SapValue ?? 1; // Green = 81 or higher
  const Features: Features = {};
  if (options.HelpToBuy) Features.HelpToBuy = true;
  if (options.Offset) Features.Offset = true;
  if (options.EarlyRepaymentCharge) Features.EarlyRepaymentCharge = true;
  if (options.NewBuild) Features.NewBuild = true;

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
    SapValue,
  });

  return input;
};
