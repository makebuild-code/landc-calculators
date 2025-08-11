import { formatNumber } from '$utils/formatting';
import { DOM_CONFIG } from '$mct/config';
import {
  RepaymentTypeENUM,
  SchemePeriodsENUM,
  SchemeTypesENUM,
  type Inputs,
  type SummaryInfo,
  type SummaryLines,
} from '$mct/types';
import { generateProductsAPIInput } from './generateProductsAPIInput';
import { MCTManager } from '$mct/manager';

const classes = DOM_CONFIG.classes;

export const generateSummaryLines = (summaryInfo: SummaryInfo, answers: Inputs): SummaryLines | null => {
  const productsAPIInput = generateProductsAPIInput();
  if (!productsAPIInput) return null;

  const { TermYears, SchemePeriods, SchemeTypes } = productsAPIInput;

  const { MortgageAmount } = MCTManager.getCalculations();
  if (!MortgageAmount) return null;

  const { RepaymentType } = answers;

  // Get repayment and term years text
  const MortgageAmountText = formatNumber(MortgageAmount, { type: 'currency' });
  const TermYearsText = `${TermYears} years`;

  // Get repayment type text
  const RepaymentTypeText =
    RepaymentType === RepaymentTypeENUM.Repayment
      ? 'repayment'
      : RepaymentTypeENUM.InterestOnly
        ? 'interest only'
        : 'part repayment part interest';

  // Get scheme periods text
  const SchemePeriodsStringified = JSON.stringify(SchemePeriods);
  const SchemePeriodsText =
    SchemePeriodsStringified === SchemePeriodsENUM.TwoYears
      ? '2-year'
      : SchemePeriodsStringified === SchemePeriodsENUM.ThreeYears
        ? '3-year'
        : SchemePeriodsStringified === SchemePeriodsENUM.FiveYears
          ? '5-year'
          : SchemePeriodsStringified === SchemePeriodsENUM.FivePlusYears
            ? '5+ year'
            : SchemePeriodsStringified === SchemePeriodsENUM.All
              ? 'all'
              : '2-5+ year';

  // Get scheme types text
  const SchemeTypesStringified = JSON.stringify(SchemeTypes);
  const SchemeTypesPrefix =
    SchemeTypesStringified === SchemeTypesENUM.Fixed
      ? 'fixed'
      : SchemeTypesStringified === SchemeTypesENUM.Variable
        ? 'variable'
        : 'fixed or variable';

  const SchemeTypesText = `${SchemeTypesPrefix} rate`;

  const BorrowOverTerm = `Looks like you want to borrow <span class="${classes.highlight}">${MortgageAmountText}</span> over <span class="${classes.highlight}">${TermYearsText}</span>`;
  const SchemeAndType = `<span class="${classes.highlight}">${SchemePeriodsText} ${SchemeTypesText} ${RepaymentTypeText}</span> mortgage`;
  const ProductsAndLenders = `Great news. We’ve found <span class="${classes.highlight}">${summaryInfo.NumberOfProducts} mortgage ${summaryInfo.NumberOfProducts === 1 ? 'product' : 'products'}</span> from <span class="${classes.highlight}">${summaryInfo.NumberOfLenders}</span> ${summaryInfo.NumberOfLenders === 1 ? 'lender' : 'different lenders'}. Click below to see your results.`;
  const DealsAndRates = `We’ve found <span class="${classes.highlight}">${summaryInfo.NumberOfProducts} deals</span> starting from <span class="${classes.highlight}">${summaryInfo.LowestRate}%</span>.`;
  const Summary = `${BorrowOverTerm} with a ${SchemeAndType}`;
  return {
    BorrowOverTerm,
    SchemeAndType,
    ProductsAndLenders,
    DealsAndRates,
    Summary,
  };
};
