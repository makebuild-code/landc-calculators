import {
  CreditImpairedENUM,
  DatePlanToRemoENUM,
  FirstTimeBuyerENUM,
  PurchRemoENUM,
  ReadinessToBuyENUM,
  RemoChangeENUM,
  RepaymentTypeENUM,
  ResiBtlENUM,
  SchemePeriodsENUM,
  SchemeTypesENUM,
  type LenderName,
} from '$mct/types';

/**
 * @todo
 *
 * - Update profiles[] with enums
 */

interface Identifier {
  PurchRemo: PurchRemoENUM;
  FTB: FirstTimeBuyerENUM;
  ResiBtl1: ResiBtlENUM;
  ResiBtl2: ResiBtlENUM;
}

interface Purchase {
  ReadinessToBuy: ReadinessToBuyENUM;
  CreditImpaired: CreditImpairedENUM;
  PropertyValue: number;
  DepositAmount: number;
  RepaymentType: RepaymentTypeENUM;
  InterestOnlyValue: number;
  MortgageLength: number;
  SchemeTypes: SchemeTypesENUM;
  SchemePeriods: SchemePeriodsENUM;
}

interface Remortgage {
  EndOfTerm: DatePlanToRemoENUM;
  PropertyValue: number;
  RepaymentType: RepaymentTypeENUM;
  InterestOnlyValue: number;
  MortgageLength: number;
  RepaymentValue: number;
  RemoChange: RemoChangeENUM;
  Lender: LenderName;
  SchemeTypes: SchemeTypesENUM;
  SchemePeriods: SchemePeriodsENUM;
}

interface Flow {
  CustomerIdentifier: Identifier;
  ResidentialPurchase: Purchase;
  FTBResidentialPurchase: Purchase;
  BTLResidentialPurchase: Purchase;
  ResidentialRemortgage: Remortgage;
  BTLRemortgage: Remortgage;
}
