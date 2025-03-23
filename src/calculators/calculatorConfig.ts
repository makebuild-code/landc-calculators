export interface CalculatorInputs {
  names: string[];
  repeats?: string[];
}

export interface CalculatorOutputs {
  names: string[];
  repeats?: string[];
}

export interface CalculatorConfig {
  inputs: CalculatorInputs;
  outputs: CalculatorOutputs;
  ifError?: string; // "There seems to be a problem with the calculator, please verify your input values."
}

export interface CalculatorConfigs {
  [key: string]: CalculatorConfig;
}

export const calculatorConfig: CalculatorConfigs = {
  residentialborrowinglimit: {
    inputs: { names: ['Applicant1Income', 'Applicant2Income', 'DepositAmount'] },
    outputs: { names: ['BorrowingAmountLower', 'BorrowingAmountHigher',] },
  },
  buytoletborrowinglimit: {
    inputs: { names: ['RentalIncome'] },
    outputs: { names: ['BorrowingAmountLower', 'BorrowingAmountHigher'] },
  },
  mortgagecost: {
    inputs: { names: ['RepaymentValue', 'TermYears', 'Rate', 'PaymentType'] },
    outputs: {
      names: [
        'MonthlyPayment',
        'TotalOverTerm',
        'CapitalRepayment',
        'InterestRepayment',
        'ChartLabels',
        'ChartDate',
      ],
    },
  },
  houseprice: {
    inputs: {
      names: [
        'Number',
        'SubBuildingName',
        'BuildingName',
        // 'DependentStreet',
        'Street',
        'Postcode',
      ],
    },
    outputs: {
      names: [
        'PropertyValue',
        'ValuationUpper',
        'ValuationLower',
        'MonthlyRental',
        'MonthlyRentalUpper',
        'MonthlyRentalLower',
      ],
    },
  },
  loantovalue: {
    inputs: { names: ['PropertyValue', 'Type', 'DepositAmount', 'LoanAmount', 'LoanToValue'] },
    outputs: { names: ['LoanAmount', 'DepositAmount', 'LoanToValue'] },
  },
  stampduty: {
    inputs: { names: ['PurchasePrice', 'Location', 'FirstTimeBuyer', 'SecondProperty'] },
    outputs: {
      names: ['BandRate', 'BandValue', 'BandCost', 'TotalCost'],
      repeats: ['StampDutyData'],
    },
  },
  overpayment: {
    inputs: {
      names: [
        'LoanAmount',
        'Rate',
        'Term',
        'LoanType',
        'Value',
        'EventDate',
        'RegularPayment',
        'Frequency',
      ],
      repeats: ['OverpaymentEvents'],
    },
    outputs: {
      names: [
        'ChartLabels',
        'ChartData',
        'ChartData2',
        'OverpayingSaving',
        'OverpayingInterest',
        'OverpayingTerm',
      ],
    },
  },
  ratechange: {
    inputs: { names: ['LoanAmount', 'CurrentRate', 'Term', 'ChangeRate', 'PaymentType'] },
    outputs: { names: ['CurrentPayment', 'NewPayment'] },
  },
  interest: {
    inputs: { names: ['AmountInvested', 'InterestRate', 'TaxStatus'] },
    outputs: { names: ['TaxRate', 'MonthlyInterest'] },
  },
  lifeinsurance: {
    inputs: {
      names: [
        'Income',
        'Spouse',
        // 'ChildAge',
        'University',
        'LoanAmount',
        'Rent',
        'TotalLoans',
        'TotalCreditCards',
        'TotalSavings',
        'TotalLifeInsurance',
        'OtherAssets',
      ],
      repeats: ['ChildAge'],
    },
    outputs: {
      names: [
        'IncomeReplacement',
        'ChildrenCover',
        'UniversityCover',
        'HousingCover',
        'Debts',
        'Assets',
        'TotalCoverRequired',
      ],
    },
  },
  savings: {
    inputs: {
      names: ['RequiredAmount', 'GrowthRate', 'DepositAmount', 'MonthlyInvestmentAmount', 'Term'],
    },
    outputs: { names: ['SavingsTermTotal', 'SavingsTotalPerMonth', 'ChartLabels', 'ChartData'] },
  },
  offsetmortgage: {
    inputs: {
      names: [
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
    },
    outputs: {
      names: [
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
  },
  bmi: {
    inputs: { names: ['Height', 'Weight'] },
    outputs: { names: ['Bmi'] },
  },
  comparerates: {
    inputs: {
      names: [
        'PropertyValue',
        'LoanAmount',
        'Term',
        'Type',
        'CurrentRate',
        'CurrentFees',
        'CurrentType',
        'CurrentSchemeLength',
        'CurrentFollowOn',
        'CompareRate',
        'CompareFees',
        'CompareType',
        'CompareSchemeLength',
        'CompareFollowOn',
        'ERCAmount',
        'ERCTerm',
        'ERCAdd',
        'ComparisonTerm',
        'InterestRateEnvironment',
      ],
    },
    outputs: { names: ['CostOfRate1', 'CostOfRate2', 'ChartLabels', 'ChartData', 'ChartData2'] },
  },
  rentprice: {
    inputs: {
      names: [
        'Number',
        'SubBuildingName',
        'BuildingName',
        'DependentStreet',
        'Street',
        'Postcode',
        'addressId',
      ],
    },
    outputs: {
      names: [
        'PropertyValue',
        'ValuationUpper',
        'ValuationLower',
        'MonthlyRental',
        'MonthlyRentalUpper',
        'MonthlyRentalLower',
      ],
    },
  },
  costofdoingnothing: {
    inputs: {
      names: [
        'PropertyValue',
        'LoanAmount',
        'Term',
        'Type',
        'CurrentRate',
        'CurrentFees',
        'CurrentType',
        'CurrentSchemeLength',
        'CurrentFollowOn',
        'CompareRate',
        'CompareFees',
        'CompareType',
        'CompareSchemeLength',
        'CompareFollowOn',
        'ERCAmount',
        'ERCTerm',
        'ERCAdd',
        'ComparisonTerm',
        'InterestRateEnvironment',
      ],
    },
    outputs: { names: ['CostOfRate1', 'CostOfRate2', 'ChartLabels', 'ChartData', 'ChartData2'] },
  },
};
