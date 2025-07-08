import { formatNumber } from '$utils/formatting';
import { DOM_CONFIG } from '$mct/config';
import {
  RepaymentTypeENUM,
  SchemePeriodsENUM,
  SchemeTypesENUM,
  type Answers,
  type CheckboxList,
  type SummaryInfo,
  type SummaryLines,
} from '$mct/types';
import { generateProductsAPIInput } from './generateProductsAPIInput';

const classes = DOM_CONFIG.classes;

export const generateSummaryLines = (summaryInfo: SummaryInfo, answers: Answers): SummaryLines | null => {
  const productsAPIInput = generateProductsAPIInput(answers);
  const { RepaymentValue, TermYears, SchemePeriods, SchemeTypes } = productsAPIInput;
  const { RepaymentType } = answers;

  // Get repayment and term years text
  const RepaymentValueText = formatNumber(RepaymentValue, { type: 'currency' });
  const TermYearsText = `${TermYears} years`;

  // Get repayment type text
  const RepaymentTypeText =
    RepaymentType === RepaymentTypeENUM.Repayment
      ? 'repayment'
      : RepaymentTypeENUM.InterestOnly
        ? 'interest only'
        : 'part repayment part interest';

  // Get scheme types text
  const SchemeTypesMap = SchemeTypes.map((type) => (type === SchemeTypesENUM.Fixed ? 'fixed' : 'variable'));

  // Get scheme periods text
  const SchemePeriodsMap = SchemePeriods.map((period) =>
    period === SchemePeriodsENUM.TwoYears
      ? '2'
      : period === SchemePeriodsENUM.ThreeYears
        ? '3'
        : period === SchemePeriodsENUM.FiveYears
          ? '5'
          : '5+'
  );

  const SchemePeriodsText = `${SchemePeriodsMap} years`;

  const SchemeTypesText =
    SchemeTypesMap.length === 1
      ? `${SchemeTypesMap[0]} rate`
      : SchemeTypesMap.length > 1
        ? `${SchemeTypesMap[0]} or ${SchemeTypesMap[1]} rate`
        : null;

  const BorrowOverTerm = `Looks like you want to borrow <span class="${classes.highlight}">${RepaymentValueText}</span> over <span class="${classes.highlight}">${TermYearsText}</span>`;
  const SchemeAndType = `<span class="${classes.highlight}">${SchemePeriodsText} ${SchemeTypesText} ${RepaymentTypeText}</span> mortgage`;
  const ProductsAndLenders = `Great news. We’ve found <span class="${classes.highlight}">${summaryInfo.NumberOfProducts} mortgage products</span> from <span class="${classes.highlight}">${summaryInfo.NumberOfLenders}</span> different lenders. Click below to see your results.`;
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
