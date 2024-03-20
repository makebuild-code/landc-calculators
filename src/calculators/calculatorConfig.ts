export interface CalculatorConfig {
  [key: string]: {
    inputNames: string[];
    outputNames: string[];
    outputRepeats?: string[];
  };
}

export const calculatorConfig: CalculatorConfig = {
  residentialborrowinglimit: {
    inputNames: ['Applicant1Income', 'Applicant2Income'],
    outputNames: ['BorrowingAmountLower', 'BorrowingAmountHigher'],
  },
  buytoletborrowinglimit: {
    inputNames: ['RentalIncome'],
    outputNames: ['BorrowingAmountLower', 'BorrowingAmountHigher'],
  },
  mortgagecost: {
    inputNames: ['RepaymentValue', 'TermYears', 'Rate', 'PaymentType'],
    outputNames: [
      'MonthlyPayment',
      'TotalOverTerm',
      'CapitalRepayment',
      'InterestRepayment',
      'ChartLabels',
      'ChartDate',
    ],
  },
  houseprice: {
    inputNames: [
      'Number',
      'SubBuildingName',
      'BuildingName',
      'DependentStreet',
      'Street',
      'Postcode',
    ],
    outputNames: [
      'PropertyValue',
      'ValuationUpper',
      'ValuationLower',
      'MonthlyRental',
      'MonthlyRentalUpper',
      'MonthlyRentalLower',
    ],
  },
  loantovalue: {
    inputNames: ['PropertyValue', 'Type', 'DepositAmount', 'LoanAmount', 'LoanToValue'],
    outputNames: ['LoanAmount', 'DepositAmount', 'LoanToValue'],
  },
  stampduty: {
    inputNames: ['PurchasePrice', 'Location', 'FirstTimeBuyer', 'SecondProperty'],
    outputNames: ['BandRate', 'BandValue', 'BandCost', 'TotalCost'],
    outputRepeats: ['StampDutyData'],
  },
};

// export interface OverpaymentRequest {
//   url: 'https://www.landc.co.uk/calculators/mortgage-overpayment-calculator/';
//   calculator: 'overpayment';
//   inputNames: {
//     LoanAmount: number; // min: 5000, max: 10000000, step: 1000, value: 125000
//     Rate: number; // min: 0.1, max: 20, step: 0.05, value: 3
//     Term: number; // min: 1, max: 40, step: 1, value: 25
//     LoanType: 'R' | 'I';
//     OverpaymentEvents: {
//       Value: number; // min: 0, max: 10000000, step: 1, value: null
//       EventDate: Date;
//     }[];
//     RegularPayment: number; // min: 0, max: 100000, step: 1, value:
//     Frequency: 'M' | 'Q' | 'H' | 'A';
//   };
//   outputNames: {
//     ChartLabels: string;
//     ChartData: string;
//     ChartData2: string;
//     OverpayingSaving: number;
//     OverpayingInterest: number;
//     OverpayingTerm: string;
//   };
// }

// export interface RateChangeRequest {
//   url: 'https://www.landc.co.uk/calculators/mortgage-interest-rate-calculator/';
//   calculator: 'ratechange';
//   inputNames: {
//     LoanAmount: number; // min: 5000, max: 10000000, step: 1000, value: 125000
//     CurrentRate: number; // min: 0.1, max: 20, step: 0.05, value: 3
//     Term: number; // min: 1, max: 40, step: 1, value: 25
//     ChangeRate: number; // min: -15, max: 15, step: 0.25, value: 0.5
//     PaymentType: 'R' | 'I';
//   };
//   outputNames: {
//     CurrentPayment: number;
//     NewPayment: number;
//   };
// }

// export interface InterestRequest {
//   url: 'https://www.landc.co.uk/calculators/interest-calculator/';
//   calculator: 'interest';
//   inputNames: {
//     AmountInvested: number; // min: 0, max: null, step: 1000, value: 0
//     InterestRate: number; // min: 0, max: null, step: 1, value: 0
//     TaxStatus: 'B' | 'H' | 'A';
//   };
//   outputNames: {
//     TaxRate: number;
//     MonthlyInterest: number;
//   };
// }

// export interface LifeInsuranceRequest {
//   url: 'https://www.landc.co.uk/calculators/life-insurance-calculator/';
//   calculator: 'lifeinsurance';
//   inputNames: {
//     Income: number; // min: 0, max: 10000000, step: 500, value: 1000
//     Spouse: boolean;
//     ChildAge: number[]; // min: 0, max: 21, step: 1, value: null
//     University: boolean;
//     LoanAmount: number; // min: 0, max: 10000000, step: 1000, value: 125000
//     Rent: number; // min: 0, max: 5000, step: 100, value: 0
//     TotalLoans: number; // min: 0, max: 200000, step: 100, value: 0
//     TotalCreditCards: number; // min: 0, max: 200000, step: 100, value: 0
//     TotalSavings: number; // min: 0, max: 10000000, step: 1000, value: 0
//     TotalLifeInsurance: number; // min: 0, max: 10000000, step: 100, value: 0
//     OtherAssets: number; // min: 0, max: 10000000, step: 100, value: 0
//   };
//   outputNames: {
//     IncomeReplacement: number;
//     ChildrenCover: number;
//     UniversityCover: number;
//     HousingCover: number;
//     Debts: number;
//     Assets: number;
//     TotalCoverRequired: number;
//   };
// }

// export interface SavingsRequest {
//   url: 'https://www.landc.co.uk/calculators/savings-calculator/';
//   calculator: 'savings';
//   inputNames: {
//     RequiredAmount: number; // min: 1, max: 10000000, step: 1000, value: null
//     GrowthRate: number; // min: 0, max: 15, step: 0.05, value: null
//     DepositAmount: number; // min: 0, max: null, step: 1000, value: null
//     MonthlyInvestmentAmount: number; // min: 0, max: null, step: 1, value: null
//     Term: number; // min: 0, max: null, step: 1, value: null
//   };
//   outputNames: {
//     SavingsTermTotal: string;
//     SavingsTotalPerMonth: number;
//     ChartLabels: string;
//     ChartData: string;
//   };
// }

// export interface OffsetMortgageRequest {
//   url: 'https://www.landc.co.uk/calculators/offset-mortgage-calculator/';
//   calculator: 'offsetmortgage';
//   inputNames: {
//     LoanAmount: number; // min: 25000, max: 10000000, step: 1000, value: 125000
//     Rate: number; // min: 0.1, max: 20, step: 0.05, value: 3
//     Term: number; // min: 1, max: 40, step: 1, value: 25
//     Fee: number; // min: 0, max: 10000, step: 50, value: 0
//     SavingsAmount: number; // min: 0, max: 10000000, step: 1000, value: null
//     SavingsRate: number; // min: 0.1, max: 20, step: 0.05, value: null
//     MonthlySavings: number; // min: 0, max: 100000, step: 10, value: null
//     OffsetRate: number; // min: 0.1, max: 20, step: 0.05, value: 4.74
//     OffsetFees: number; // min: 0, max: 10000, step: 50, value: 1495.00
//     CompareTerm: number; // min: 1, max: 40, step: 1, value: 2
//     TaxStatus: 'B' | 'H' | 'A';
//   };
//   outputNames: {
//     OffsetStandardMonthly: number;
//     OffsetMonthly: number;
//     OffsetStandardInterestCost: number;
//     OffsetInterestCost: number;
//     OffsetInterestEarned: number;
//     ChartLabels: string;
//     ChartData: string;
//     ChartData2: string;
//   };
// }

// export interface BuyToLetTaxChangeRequest {
//   url: 'https://www.landc.co.uk/calculators/buy-to-let-mortgage-calculator/';
//   calculator: 'buytolettaxchange';
//   inputNames: {
//     RepaymentValue: number; // not on site
//     Rent: number; // min: 1, max: 100000, step: 1000, value: 1000
//     Rate: number; // not on site
//   };
//   outputNames: {
//     BTLAnnualRentalIncome: number;
//     BTLWearAndTear: number;
//     BTLInterest: number;
//     BTLTaxChange2016: number;
//     BTLNetIncome2016: number;
//     BTLTaxChange2017: number;
//     BTLNetIncome2017: number;
//     BTLTaxChange2018: number;
//     BTLNetIncome2018: number;
//     BTLTaxChange2019: number;
//     BTLNetIncome2019: number;
//     BTLTaxChange2020: number;
//     BTLNetIncome2020: number;
//   };
// }

// export interface BmiRequest {
//   url: 'https://www.landc.co.uk/calculators/bmi-calculator/';
//   calculator: 'bmi';
//   inputNames: {
//     Height: number; // min: 1, max: 300, step: 10, value: 178
//     Weight: number; // min: 1, max: null, step: 1, value: 78
//   };
//   outputNames: {
//     Bmi: number;
//   };
// }

// export interface CompareRatesRequest {
//   url: 'https://www.landc.co.uk/calculators/compare-two-rates/';
//   calculator: 'comparerates';
//   inputNames: {
//     PropertyValue: number; // min: 1, max: 10000000, step: 500, value: 250000
//     LoanAmount: number; // min: 5000, max: 10000000, step: 1000, value: 125000
//     Term: number; // min: 1, max: 40, step: 1, value: 25
//     Type: 'R' | 'I';
//     ComparisonRates: {
//       Rate: number; // min: 0.1, max: 15, step: 0.05, value: null | 4.99
//       Fees: number; // min: -10000000, max: 10000000, step: 100, value: null | 850
//       Type: 'F' | 'V';
//       SchemeLength: number; // min: 1, max: 480 | 300, step: 12, value: null | 36
//       ERCAmount: number; // min: 0, max: 100000, step: 100, value: null
//       ERCTerm: number; // min: 0, max: 300, step: 1, value:
//       ERCAdd: boolean;
//       FollowOn: number; // min: 0.1, max: 15, step: 0.05, value: 5.6 | 7
//     }[];
//     ComparisonTerm: number; // min: 2, max: 60, step: 12, value: 24
//     InterestRateEnvironment: 1 | 2 | 3 | 4 | 5 | 6;
//   };
//   outputNames: {
//     CostOfRate1: number;
//     CostOfRate2: number;
//     ChartLabels: string;
//     ChartData: string;
//     ChartData2: string;
//   };
// }
