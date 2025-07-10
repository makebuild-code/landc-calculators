import { MCTManager } from '$mct/manager';
import {
  CreditImpairedENUM,
  EndOfTermENUM,
  FirstTimeBuyerENUM,
  MortgageTypeENUM,
  PropertyTypeENUM,
  PurchRemoENUM,
  ReadinessToBuyENUM,
  RemoChangeENUM,
  RepaymentTypeENUM,
  ResiBtlENUM,
  SapValueENUM,
  SchemePeriodsENUM,
  SchemePurposeENUM,
  SchemeTypesENUM,
  SortColumnENUM,
  type AnswerKey,
  type AnswerValue,
} from '$mct/types';

export const getValueAsLandC = (key: AnswerKey): AnswerValue | null => {
  const value = MCTManager.getAnswer(key);
  if (!value) return null;

  switch (key) {
    case 'CreditImpaired':
      return CreditImpairedENUM[value as keyof typeof CreditImpairedENUM];
    case 'EndOfTerm':
      return EndOfTermENUM[value as keyof typeof EndOfTermENUM];
    case 'FTB':
      return FirstTimeBuyerENUM[value as keyof typeof FirstTimeBuyerENUM];
    case 'MortgageType':
      return MortgageTypeENUM[value as keyof typeof MortgageTypeENUM];
    case 'PropertyType':
      return PropertyTypeENUM[value as keyof typeof PropertyTypeENUM];
    case 'PurchRemo':
      return PurchRemoENUM[value as keyof typeof PurchRemoENUM];
    case 'ReadinessToBuy':
      return ReadinessToBuyENUM[value as keyof typeof ReadinessToBuyENUM];
    case 'RemoChange':
      return RemoChangeENUM[value as keyof typeof RemoChangeENUM];
    case 'RepaymentType':
      return RepaymentTypeENUM[value as keyof typeof RepaymentTypeENUM];
    case 'ResiBtl':
      return ResiBtlENUM[value as keyof typeof ResiBtlENUM];
    case 'SapValue':
      return SapValueENUM[value as keyof typeof SapValueENUM];
    case 'SchemePeriods':
      return SchemePeriodsENUM[value as keyof typeof SchemePeriodsENUM];
    case 'SchemeTypes':
      return (value as string[]).map((v) => SchemeTypesENUM[v as keyof typeof SchemeTypesENUM]);
    case 'SchemePurpose':
      return SchemePurposeENUM[value as keyof typeof SchemePurposeENUM];
    case 'SortColumn':
      return SortColumnENUM[value as keyof typeof SortColumnENUM];
    default:
      return value;
  }
};
