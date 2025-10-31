import { RepaymentTypeENUM, ResiBtlENUM, type CONFIG_FORM } from '$mct/types';

export const FORM_DEFAULT_CONFIG: CONFIG_FORM = {
  RepaymentType: RepaymentTypeENUM.Repayment,
  ResiBtl: ResiBtlENUM.Residential,
  LoanAmount: 1,
  MortgageLength: 1,
  PropertyValue: 1,
};
