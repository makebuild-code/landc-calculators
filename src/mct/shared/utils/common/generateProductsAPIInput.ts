import { filterAllowed } from '$utils/formatting/filterAllowed';
import type { Answers, CheckboxValues, Features, ProductsOptions, ProductsRequest } from '$mct/types';

const DEFAULT_OPTIONS: ProductsOptions = {
  numberOfResults: 1,
  sortColumn: 1,
};

export const generateProductsAPIInput = (answers: Answers, options: ProductsOptions = {}): ProductsRequest => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const PropertyValue = answers.PropertyValue as number;
  const DepositAmount = answers.DepositAmount as number;
  let RepaymentValue = (answers.RepaymentValue as number) || null;

  if (!RepaymentValue) RepaymentValue = PropertyValue - DepositAmount;

  const PropertyType = 1; // property type not a question
  const MortgageType = answers.ResiBtl === 'R' ? 1 : 2;
  const TermYears = answers.MortgageLength as number;
  const SchemePurpose = answers.PurchRemo === 'P' ? 1 : 2;
  const NumberOfResults = opts.numberOfResults ?? 1;
  const SortColumn = (opts.sortColumn ?? 1) as 1 | 2 | 3 | 4 | 5 | 6;

  const SchemeTypes = (() => {
    const value = answers.SchemeTypes as CheckboxValues;
    if (typeof value === 'boolean') return [];
    return filterAllowed(value, [1, 2] as const);
  })();

  const Features: Features = {};
  if (answers.HelpToBuy) Features.HelpToBuy = true;
  if (answers.Offset) Features.Offset = true;
  if (answers.EarlyRepaymentCharge) Features.EarlyRepaymentCharge = true;
  if (answers.NewBuild) Features.NewBuild = true;

  const SapValue = answers.SapValue ? answers.SapValue : null;

  const input: ProductsRequest = {
    PropertyValue,
    RepaymentValue,
    PropertyType,
    MortgageType,
    InterestOnlyValue: answers.InterestOnlyValue as number,
    TermYears,
    SchemePurpose,
    SchemePeriods: Array(answers.SchemePeriods) as (1 | 2 | 3 | 4)[] | ('1' | '2' | '3' | '4')[],
    SchemeTypes,
    NumberOfResults,
    SortColumn,
    Features,
  };

  if (SapValue) input.SapValue = SapValue as number;

  return input;
};
