import { formatNumber } from '$utils/formatNumber';
import type { ProductsRequest, ProductsResponse, SummaryInfo } from '../api/types/fetchProducts';
import { classes } from '../constants';
import type { Answers } from '../types';
import { generateProductsAPIInput } from './generateProductsAPIInput';

export interface SummaryLines {
  BorrowOverTerm: string;
  SchemeAndType: string;
  ProductsAndLenders: string;
  DealsAndRates: string;
  Summary: string;
}

export const generateSummaryLines = (summaryInfo: SummaryInfo, answers: Answers): SummaryLines | null => {
  const productsAPIInput = generateProductsAPIInput(answers);
  const { RepaymentValue, TermYears, SchemePeriods, SchemeTypes } = productsAPIInput;
  const { RepaymentType } = answers;

  const RepaymentValueText = formatNumber(RepaymentValue, { type: 'currency' });
  const TermYearsText = `${TermYears} years`;
  const RepaymentTypeText =
    RepaymentType === 'R' ? 'repayment' : RepaymentType === 'I' ? 'interest only' : 'part repayment part interest';

  const SchemeTypesMap = SchemeTypes.map((type) => (type === 1 ? 'fixed' : 'variable'));
  const SchemePeriodsMap = SchemePeriods.map((period) =>
    period === 1 || period === '1'
      ? '2'
      : period === 2 || period === '2'
        ? '3'
        : period === 3 || period === '3'
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
  const ProductsAndLenders = `We’ve found <span class="${classes.highlight}">${summaryInfo.NumberOfProducts}</span> products for you across <span class="${classes.highlight}">${summaryInfo.NumberOfLenders}</span> lenders.`;
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
