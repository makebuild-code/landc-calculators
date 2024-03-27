export interface CalculatorConfig {
  [key: string]: {
    inputNames: string[];
    inputRepeats?: string[];
    outputNames: string[];
    outputRepeats?: string[];
    ifError?: string; // "There seems to be a problem with the calculator, please verify your input values."
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
      'addressId',
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
  overpayment: {
    inputNames: [
      'LoanAmount',
      'Rate',
      'Term',
      'LoanType',
      'Value',
      'EventDate',
      'RegularPayment',
      'Frequency',
    ],
    inputRepeats: ['OverpaymentEvents'],
    outputNames: [
      'ChartLabels',
      'ChartData',
      'ChartData2',
      'OverpayingSaving',
      'OverpayingInterest',
      'OverpayingTerm',
    ],
  },
  ratechange: {
    inputNames: ['LoanAmount', 'CurrentRate', 'Term', 'ChangeRate', 'PaymentType'],
    outputNames: ['CurrentPayment', 'NewPayment'],
  },
  interest: {
    inputNames: ['AmountInvested', 'InterestRate', 'TaxStatus'],
    outputNames: ['TaxRate', 'MonthlyInterest'],
  },
  lifeinsurance: {
    inputNames: [
      'Income',
      'Spouse',
      'ChildAge',
      'University',
      'LoanAmount',
      'Rent',
      'TotalLoans',
      'TotalCreditCards',
      'TotalSavings',
      'TotalLifeInsurance',
      'OtherAssets',
    ],
    outputNames: [
      'IncomeReplacement',
      'ChildrenCover',
      'UniversityCover',
      'HousingCover',
      'Debts',
      'Assets',
      'TotalCoverRequired',
    ],
  },
  savings: {
    inputNames: [
      'RequiredAmount',
      'GrowthRate',
      'DepositAmount',
      'MonthlyInvestmentAmount',
      'Term',
    ],
    outputNames: ['SavingsTermTotal', 'SavingsTotalPerMonth', 'ChartLabels', 'ChartData'],
  },
  offsetmortgage: {
    inputNames: [
      'LoanAmount',
      'Rate',
      'Term',
      'Fee',
      'SavingsAmount',
      'SavingsRate',
      'MonthlySavings',
      'OffsetRate',
      'OffsetFees',
      'CompareTerm',
      'TaxStatus',
    ],
    outputNames: [
      'OffsetStandardMonthly',
      'OffsetMonthly',
      'OffsetStandardInterestCost',
      'OffsetInterestCost',
      'OffsetInterestEarned',
      'ChartLabels',
      'ChartData',
      'ChartData2',
    ],
  },
  // buytolettaxchange: {
  //   inputNames: ['RepaymentValue', 'Rent', 'Rate'],
  //   outputNames: [
  //     'BTLAnnualRentalIncome',
  //     'BTLWearAndTear',
  //     'BTLInterest',
  //     'BTLTaxChange2016',
  //     'BTLNetIncome2016',
  //     'BTLTaxChange2017',
  //     'BTLNetIncome2017',
  //     'BTLTaxChange2018',
  //     'BTLNetIncome2018',
  //     'BTLTaxChange2019',
  //     'BTLNetIncome2019',
  //     'BTLTaxChange2020',
  //     'BTLNetIncome2020',
  //   ],
  // },
  bmi: {
    inputNames: ['Height', 'Weight'],
    outputNames: ['Bmi'],
  },
  comparerates: {
    inputNames: [
      'PropertyValue',
      'LoanAmount',
      'Term',
      'Type',
      'Rate',
      'Fees',
      'Type',
      'SchemeLength',
      'ERCAmount',
      'ERCTerm',
      'ERCAdd',
      'FollowOn',
      'ComparisonTerm',
      'InterestRateEnvironment',
    ],
    inputRepeats: ['ComparisonRates'],
    outputNames: ['CostOfRate1', 'CostOfRate2', 'ChartLabels', 'ChartData', 'ChartData2'],
  },
};
