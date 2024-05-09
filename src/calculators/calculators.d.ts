export interface ResidentialBorrowingLimitRequest {
  url: 'https://www.landc.co.uk/calculators/how-much-can-i-borrow-mortgage-calculator/';
  calculator: 'residentialborrowinglimit';
  input: {
    Applicant1Income: number; // min: 1000, max: 1000000, step: 1000, value: 30000
    Applicant2Income: number; // min: 0, max: 1000000, step: 1000, value: 0
  };
  output: {
    BorrowingAmountLower: number;
    BorrowingAmountHigher: number;
  };
}

export interface BuyToLetBorrowingLimitRequest {
  url: 'https://www.landc.co.uk/calculators/buy-to-let-mortgage-calculator/';
  calculator: 'buytoletborrowinglimit';
  input: {
    RentalIncome: number; // min: 1, max: 100000, step: 1000, value: 1000
  };
  output: {
    BorrowingAmountLower: number;
    BorrowingAmountHigher: number;
  };
}

export interface MortgageCostRequest {
  url: 'https://www.landc.co.uk/calculators/how-much-will-my-mortgage-cost/';
  calculator: 'mortgagecost';
  input: {
    RepaymentValue: number; // min: 0, max: 10000000, step: 1000, value: 125000
    TermYears: number; // min: 1, max: 40, step: 1, value: 25
    Rate: number; // min: 0.1, max: 20, step: 0.1, value: 3
    PaymentType: 'r' | 'i';
  };
  output: {
    MonthlyPayment: number;
    TotalOverTerm: number;
    CapitalRepayment: number;
    InterestRepayment: number;
    ChartLabels: string;
    ChartData: string;
  };
}

export interface HousePriceRequest {
  url: 'https://www.landc.co.uk/calculators/house-price-calculator/';
  calculator: 'houseprice';
  input: {
    Number: string;
    SubBuildingName: string;
    BuildingName: string;
    DependentStreet: string;
    Street: string;
    Postcode: string;
  };
  output: {
    PropertyValue: number;
    ValuationUpper: number;
    ValuationLower: number;
    MonthlyRental: number;
    MonthlyRentalUpper: number;
    MonthlyRentalLower: number;
  };
}

export interface LoanToValueRequest {
  url: 'https://www.landc.co.uk/calculators/loan-to-value/';
  calculator: 'loantovalue';
  input: {
    PropertyValue: number; // min: 1000, max: 10000000, step: 500, value: 250000
    Type: 'Deposit' | 'Loan' | 'Ltv';
    DepositAmount: number; // min: 1, max: 10000000, step: 500, value: 125000
    LoanAmount: number; // min: 1, max: 10000000, step: 500, value: 125000
    LoanToValue: number; // min: 1, max: 100, step: 0.01, value: 50
  };
  output: {
    LoanAmount: number;
    DepositAmount: number;
    LoanToValue: number;
  };
}

export interface StampDutyRequest {
  url: 'https://www.landc.co.uk/calculators/stamp-duty-calculator/';
  calculator: 'stampduty';
  input: {
    PurchasePrice: number; // min: 1, max: 10000000, step: 500, value: 250000
    Location: 'E' | 'S' | 'W';
    FirstTimeBuyer: boolean;
    SecondProperty: boolean;
  };
  output: {
    StampDutyData: {
      BandRate: number;
      BandValue: number;
      BandCost: number;
    }[];
    TotalCost: number;
    // TotalPercentage: number; - we need to calculate this?
  };
}

export interface OverpaymentRequest {
  url: 'https://www.landc.co.uk/calculators/mortgage-overpayment-calculator/';
  calculator: 'overpayment';
  input: {
    LoanAmount: number; // min: 5000, max: 10000000, step: 1000, value: 125000
    Rate: number; // min: 0.1, max: 20, step: 0.05, value: 3
    Term: number; // min: 1, max: 40, step: 1, value: 25
    LoanType: 'R' | 'I';
    OverpaymentEvents: {
      Value: number; // min: 0, max: 10000000, step: 1, value: null
      EventDate: Date;
    }[];
    RegularPayment: number; // min: 0, max: 100000, step: 1, value:
    Frequency: 'M' | 'Q' | 'H' | 'A';
  };
  output: {
    ChartLabels: string;
    ChartData: string;
    ChartData2: string;
    OverpayingSaving: number;
    OverpayingInterest: number;
    OverpayingTerm: string;
  };
}

export interface RateChangeRequest {
  url: 'https://www.landc.co.uk/calculators/mortgage-interest-rate-calculator/';
  calculator: 'ratechange';
  input: {
    LoanAmount: number; // min: 5000, max: 10000000, step: 1000, value: 125000
    CurrentRate: number; // min: 0.1, max: 20, step: 0.05, value: 3
    Term: number; // min: 1, max: 40, step: 1, value: 25
    ChangeRate: number; // min: -15, max: 15, step: 0.25, value: 0.5
    PaymentType: 'R' | 'I';
  };
  output: {
    CurrentPayment: number;
    NewPayment: number;
  };
}

export interface InterestRequest {
  url: 'https://www.landc.co.uk/calculators/interest-calculator/';
  calculator: 'interest';
  input: {
    AmountInvested: number; // min: 0, max: null, step: 1000, value: 0
    InterestRate: number; // min: 0, max: null, step: 1, value: 0
    TaxStatus: 'B' | 'H' | 'A';
  };
  output: {
    TaxRate: number;
    MonthlyInterest: number;
  };
}

export interface LifeInsuranceRequest {
  url: 'https://www.landc.co.uk/calculators/life-insurance-calculator/';
  calculator: 'lifeinsurance';
  input: {
    Income: number; // min: 0, max: 10000000, step: 500, value: 30000
    Spouse: boolean;
    ChildAge: number[]; // min: 0, max: 21, step: 1, value: null
    University: boolean;
    LoanAmount: number; // min: 0, max: 10000000, step: 1000, value: 125000
    Rent: number; // min: 0, max: 5000, step: 100, value: 0
    TotalLoans: number; // min: 0, max: 200000, step: 100, value: 0
    TotalCreditCards: number; // min: 0, max: 200000, step: 100, value: 0
    TotalSavings: number; // min: 0, max: 10000000, step: 1000, value: 0
    TotalLifeInsurance: number; // min: 0, max: 10000000, step: 100, value: 0
    OtherAssets: number; // min: 0, max: 10000000, step: 100, value: 0
  };
  output: {
    IncomeReplacement: number;
    ChildrenCover: number;
    UniversityCover: number;
    HousingCover: number;
    Debts: number;
    Assets: number;
    TotalCoverRequired: number;
  };
}

export interface SavingsRequest {
  url: 'https://www.landc.co.uk/calculators/savings-calculator/';
  calculator: 'savings';
  input: {
    RequiredAmount: number; // min: 1, max: 10000000, step: 1000, value: null
    GrowthRate: number; // min: 0, max: 15, step: 0.05, value: null
    DepositAmount: number; // min: 0, max: null, step: 1000, value: null
    MonthlyInvestmentAmount: number; // min: 0, max: null, step: 1, value: null
    Term: number; // min: 0, max: null, step: 1, value: null
  };
  output: {
    SavingsTermTotal: string;
    SavingsTotalPerMonth: number;
    ChartLabels: string;
    ChartData: string;
  };
}

export interface OffsetMortgageRequest {
  url: 'https://www.landc.co.uk/calculators/offset-mortgage-calculator/';
  calculator: 'offsetmortgage';
  input: {
    LoanAmount: number; // min: 25000, max: 10000000, step: 1000, value: 125000
    Rate: number; // min: 0.1, max: 20, step: 0.05, value: 3
    Term: number; // min: 1, max: 40, step: 1, value: 25
    Fee: number; // min: 0, max: 10000, step: 50, value: 0
    SavingsAmount: number; // min: 0, max: 10000000, step: 1000, value: null
    SavingsRate: number; // min: 0.1, max: 20, step: 0.05, value: null
    MonthlySavings: number; // min: 0, max: 100000, step: 10, value: null
    OffsetRate: number; // min: 0.1, max: 20, step: 0.05, value: 4.74
    OffsetFees: number; // min: 0, max: 10000, step: 50, value: 1495.00
    CompareTerm: number; // min: 1, max: 40, step: 1, value: 2
    TaxStatus: 'B' | 'H' | 'A';
  };
  output: {
    OffsetStandardMonthly: number;
    OffsetMonthly: number;
    OffsetStandardInterestCost: number;
    OffsetInterestCost: number;
    OffsetInterestEarned: number;
    ChartLabels: string;
    ChartData: string;
    ChartData2: string;
  };
}

export interface BmiRequest {
  url: 'https://www.landc.co.uk/calculators/bmi-calculator/';
  calculator: 'bmi';
  input: {
    Height: number; // min: 1, max: 300, step: 10, value: 178
    Weight: number; // min: 1, max: null, step: 1, value: 78
  };
  output: {
    Bmi: number;
  };
}

export interface CompareRatesRequest {
  url: 'https://www.landc.co.uk/calculators/compare-two-rates/';
  calculator: 'comparerates';
  input: {
    PropertyValue: number; // min: 1, max: 10000000, step: 500, value: 250000
    LoanAmount: number; // min: 5000, max: 10000000, step: 1000, value: 125000
    Term: number; // min: 1, max: 40, step: 1, value: 25
    Type: 'R' | 'I';
    ComparisonRates: {
      Rate: number; // min: 0.1, max: 15, step: 0.05, value: null | 4.99
      Fees: number; // min: -10000000, max: 10000000, step: 100, value: null | 850
      Type: 'F' | 'V';
      SchemeLength: number; // min: 1, max: 480 | 300, step: 12, value: null | 36
      ERCAmount: number; // min: 0, max: 100000, step: 100, value: null
      ERCTerm: number; // min: 0, max: 300, step: 1, value:
      ERCAdd: boolean;
      FollowOn: number; // min: 0.1, max: 15, step: 0.05, value: 5.6 | 7
    }[];
    ComparisonTerm: number; // min: 2, max: 60, step: 12, value: 24
    InterestRateEnvironment: 1 | 2 | 3 | 4 | 5 | 6;
  };
  output: {
    CostOfRate1: number;
    CostOfRate2: number;
    ChartLabels: string;
    ChartData: string;
    ChartData2: string;
  };
}

export interface RentPriceRequest {
  url: 'https://www.landc.co.uk/calculators/house-price-calculator/';
  calculator: 'houseprice';
  input: {
    Number: string;
    SubBuildingName: string;
    BuildingName: string;
    DependentStreet: string;
    Street: string;
    Postcode: string;
  };
  output: {
    PropertyValue: number;
    ValuationUpper: number;
    ValuationLower: number;
    MonthlyRental: number;
    MonthlyRentalUpper: number;
    MonthlyRentalLower: number;
  };
}

export interface CostOfDoingNothingRequest {
  url: 'https://www.landc.co.uk/calculators/compare-two-rates/';
  calculator: 'comparerates';
  input: {
    PropertyValue: number; // min: 1, max: 10000000, step: 500, value: 250000
    LoanAmount: number; // min: 5000, max: 10000000, step: 1000, value: 125000
    Term: number; // min: 1, max: 40, step: 1, value: 25
    Type: 'R' | 'I';
    ComparisonRates: {
      Rate: number; // min: 0.1, max: 15, step: 0.05, value: null | 4.99
      Fees: number; // min: -10000000, max: 10000000, step: 100, value: null | 850
      Type: 'F' | 'V';
      SchemeLength: number; // min: 1, max: 480 | 300, step: 12, value: null | 36
      ERCAmount: number; // min: 0, max: 100000, step: 100, value: null
      ERCTerm: number; // min: 0, max: 300, step: 1, value:
      ERCAdd: boolean;
      FollowOn: number; // min: 0.1, max: 15, step: 0.05, value: 5.6 | 7
    }[];
    ComparisonTerm: number; // min: 2, max: 60, step: 12, value: 24
    InterestRateEnvironment: 1 | 2 | 3 | 4 | 5 | 6;
  };
  output: {
    CostOfRate1: number;
    CostOfRate2: number;
    ChartLabels: string;
    ChartData: string;
    ChartData2: string;
  };
}
