import { MCTManager } from '$mct/manager';
import { RepaymentTypeENUM, ResiBtlENUM, type EnquiryMinimum, type ICID, type LCID } from '$mct/types';

export const getFormDefaults = (): EnquiryMinimum => {
  return {
    lcid: MCTManager.getLCID() as LCID,
    icid: MCTManager.getICID() as ICID,
    ResiBtl: ResiBtlENUM.Residential,
    PropertyValue: 1,
    RepaymentType: RepaymentTypeENUM.Repayment,
    MortgageLength: 1,
    LoanAmount: 1,
  };
};
