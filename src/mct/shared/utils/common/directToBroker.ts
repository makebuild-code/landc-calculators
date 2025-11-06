import { EVENTS_CONFIG } from '$mct/config';
import { MCTManager } from '$mct/manager';
import { RepaymentTypeENUM } from '$mct/types';
import { debugLog } from '$utils/debug';

export const directToBroker = (): void => {
  debugLog('🔄 Directing to broker');

  MCTManager.logUserEvent({
    EventName: EVENTS_CONFIG.directToBroker,
    EventValue: 'OEF',
  });

  const { origin } = window.location;
  const baseUrl = `${origin}/online/populate`;

  const icid = MCTManager.getICID();
  const lcid = MCTManager.getLCID();
  const answers = MCTManager.getAnswersAsLandC();
  const calculations = MCTManager.getCalculations();

  const { PurchRemo, ResiBtl, CreditImpaired, PropertyValue, RepaymentType, MortgageLength, ReadinessToBuy } = answers;

  const { offerAccepted, MortgageAmount } = calculations;

  const params: Record<string, string> = {};

  if (icid) params.Icid = icid;
  if (lcid) params.LcId = lcid;
  if (PurchRemo) params.PurchaseOrRemortgage = PurchRemo;
  if (ResiBtl) params.ResidentialOrBuyToLet = ResiBtl;
  if (CreditImpaired) params.CreditIssues = CreditImpaired;
  if (PropertyValue) params.PropertyValue = PropertyValue.toString();
  if (MortgageAmount) params.LoanAmount = MortgageAmount.toString();
  if (MortgageLength) params.Term = MortgageLength.toString();
  if (RepaymentType)
    params.MortgageRepaymentType =
      RepaymentType === RepaymentTypeENUM.Repayment ? 'R' : RepaymentType === RepaymentTypeENUM.Both ? 'P' : 'I';
  if (offerAccepted) params.OfferAccepted = offerAccepted.toString();
  if (ReadinessToBuy) params.StageOfJourney = ReadinessToBuy;

  const oefParams = new URLSearchParams(params);
  const url = `${baseUrl}?${oefParams.toString()}`;

  window.open(url, '_blank');
};
