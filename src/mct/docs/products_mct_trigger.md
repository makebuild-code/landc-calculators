# website middle layer - products mct http endpoint

Last Updated Date : 29/04/2025

Created Date : 29/04/2025

## Contents

- [website middle layer - products mct http endpoint](#website-middle-layer---products-mct-http-endpoint)
  - [Contents](#contents)
  - [Base URLs](#base-urls)
  - [Authentication](#authentication)
  - [Security](#security)
  - [\[POST\] api/ProductsMCTHttpTrigger](#post-apiproductsmcthttptrigger)
    - [parameters](#parameters)
    - [Example Payloads](#example-payloads)
    - [Data validation Rules](#data-validation-rules)
    - [Responses](#responses)
      - [HTTP 200 OK](#http-200-ok)
      - [HTTP 400 Bad Request](#http-400-bad-request)
      - [HTTP 500 Internal server error](#http-500-internal-server-error)

---

## Base URLs

| Environment | Url                           |
| ----------- | ----------------------------- |
| Dev:        | https://dev.landc.co.uk/api/  |
| UAT:        | https://test.landc.co.uk/api/ |
| Production  | https://www.landc.co.uk/api/  |

## Authentication

none

## Security

Auth token / IP white list

<small>^ [Back to Top](#website-middle-layer---products-mct-http-endpoint)</small>

---

## [POST] api/ProductsMCTHttpTrigger

Calls internal endpoint:

e.g. `/productdata/bestbuysMCT`

### parameters

```ts
{
    "input": {
        "PropertyValue": INT,
        "RepaymentValue": INT,
        "PropertyType": PropertyType // Enum - INT - valid values - house (1) or flat (2), --- Should we default to house for the products call given we don't have a relevant question?
        "MortgageType": MortgageType // Enum - INT - valid values - Residential (1) or Buy to Let (2),
        "InterestOnlyValue": INT,
        "TermYears": INT,
        "SchemePurpose": SchemePurpose // Enum - INT - valid values - Purchase (1) or Remortgage (2),
        "SchemePeriods": [ // SchemePeriod Enum Array
            "1", // 1 = 2 years
            "2", // 2 = 3 years
            "3", // 3 = 5 years
            "4"  // 4 = 5+ years
        ],
        "SchemeTypes": [ // SchemeType Enum Array
            "1", // 1 = Fixed
            "2"  // 2 = Variable
        ],
        "NumberOfResults": INT,
        "Features": { // Features object
            "HelpToBuy": BOOLEAN,
            "Offset": BOOLEAN,
            "EarlyRepaymentCharge": BOOLEAN,
            "NewBuild": BOOLEAN
        },
        "SortColumn":  SortColumn // Valid Values: Rate = 1, AverageAnnualCost = 2, MaxLTV = 3, MonthlyPayment = 4, Lender = 5, Fees = 6
        "UseStaticApr": BOOLEAN,
        "SapValue": INT,
        "Lenders" : STRING, // Csv string of master lender ids to filter by Else empty OR null to bring back all lenders
        "IncludeRetention": BOOLEAN,
        "RetentionLenderId": INT
    }
}
```

### Example Payloads

```json
{
  "input": {
    "PropertyValue": "250000",
    "RepaymentValue": "125000",
    "PropertyType": "1",
    "MortgageType": "1",
    "InterestOnlyValue": "0",
    "TermYears": "25",
    "SchemePurpose": "1",
    "SchemePeriods": ["1", "2", "3", "4"],
    "SchemeTypes": ["1", "2"],
    "NumberOfResults": "3",
    "Features": {
      "Erc": false,
      "Offset": false,
      "NewBuild": false
    },
    "SortColumn": "1",
    "UseStaticApr": false,
    "SapValue": 50,
    "Lenders": "",
    "IncludeRetention": false,
    "RetentionLenderId": ""
  }
}
```

### Data validation Rules

Mandatory inputs are as follows:

- `PropertyValue`
- `RepaymentValue`
- `PropertyType`
- `MortgageType`
- `TermYears`
- `SchemePurpose`
- `NumberOfResults`
- `SortColumn`

### Responses

#### HTTP 200 OK

```json
{
  "url": "https://integrationdev.landc.co.uk/productdata/bestbuysMCT",
  "body": "{\"PropertyValue\":100000,\"PropertyType\":2,\"MortgageType\":1,\"RepaymentValue\":80000,\"InterestOnlyValue\":0,\"TermYears\":25,\"SchemePurpose\":2,\"SchemePeriods\":[1],\"SchemeTypes\":[1],\"NumberOfResults\":100,\"Features\":{\"HelpToBuy\":false,\"OffSet\":false,\"EarlyRepaymentCharge\":false,\"NewBuild\":false},\"SortColumn\":1,\"UseStaticApr\":false,\"SapValue\":50,\"Lenders\":\"\",\"IncludeRetention\":false,\"RetentionLenderId\":\"\"}",
  "result": {
    "SummaryInfo": {
      "LowestRate": 4.49,
      "LowestPMT": 444.21,
      "LowestAnnualCost": 5429,
      "NumberOfLenders": 51,
      "NumberOfProducts": 258
    },
    "Products": [
      {
        "ProductId": 622584,
        "LenderId": 80,
        "LenderName": "Vernon",
        "DirectToLender": false,
        "ApplyDirectLink": "",
        "LenderURL": "https://assets.landc.co.uk/lender/Vernon.gif",
        "ProductSchemeFriendlyName": "Fixed to 31/05/27",
        "Rate": 4.49,
        "FollowOnRate": "then 7.85% (variable)",
        "PMT": 444,
        "FutureValue": 76369.11,
        "FutureMonthlyPayment": 599,
        "TotalFees": 1473,
        "AnnualCost": 6067.02,
        "ApplicationFee": 0,
        "CompletionFee": 999,
        "ValuationFee": 165,
        "OtherFees": 0,
        "Cashback": 0,
        "BrokerFee": 0,
        "OverpaymentLimit": "10% p/a",
        "ERC": "Early Repayment Charges apply",
        "ERCText": "2% until 31/05/27",
        "ExitFee": 100,
        "Legals": "Payable",
        "MinimumMortgageAmount": 50000,
        "MaximumMortgageAmount": 1500000,
        "LTV": 80,
        "APR": 7.483,
        "FollowOnRateValue": 7.85,
        "SchemeLength": 24,
        "SchemeTypeRefId": 51,
        "IsRemortgage": true,
        "RepresentativeExample": "A mortgage of £80,000 payable over 25 years, initially on a fixed rate for 2 years at 4.49% and then on a variable rate of 7.85% for the remaining 23 years would require 24 payments of £444 and 276 payments of £599. The total amount payable would be £177,177 made up of the loan amount plus interest (£95,704) and fees (£1,473). The overall cost for comparison is 7.5% APRC representative.",
        "SAP": 1,
        "SharedOwnership": "Not Available",
        "NewBuild": "Also Available for New Build",
        "Offset": false,
        "LtdCompany": "",
        "HMO": false,
        "Channel": "Everyone",
        "AvailableFor": "Both"
      },
      {
        "ProductId": 612728,
        "LenderId": 65,
        "LenderName": "Yorkshire BS",
        "DirectToLender": false,
        "ApplyDirectLink": "",
        "LenderURL": "https://assets.landc.co.uk/lender/yorkshire.gif",
        "ProductSchemeFriendlyName": "Fixed to 31/05/27",
        "Rate": 4.53,
        "FollowOnRate": "then 7.49% (variable)",
        "PMT": 446,
        "FutureValue": 76388.99,
        "FutureMonthlyPayment": 581,
        "TotalFees": 995,
        "AnnualCost": 5849.86,
        "ApplicationFee": 0,
        "CompletionFee": 995,
        "ValuationFee": 0,
        "OtherFees": 0,
        "Cashback": 0,
        "BrokerFee": 0,
        "OverpaymentLimit": "10% p/a",
        "ERC": "Early Repayment Charges apply",
        "ERCText": "2.5% reducing to 2% until 31/05/27",
        "ExitFee": 90,
        "Legals": "Free",
        "MinimumMortgageAmount": 50000,
        "MaximumMortgageAmount": 5000000,
        "LTV": 80,
        "APR": 7.166,
        "FollowOnRateValue": 7.49,
        "SchemeLength": 24,
        "SchemeTypeRefId": 51,
        "IsRemortgage": true,
        "RepresentativeExample": "A mortgage of £80,000 payable over 25 years, initially on a fixed rate for 2 years at 4.53% and then on a variable rate of 7.49% for the remaining 23 years would require 24 payments of £446 and 276 payments of £581. The total amount payable would be £172,055 made up of the loan amount plus interest (£91,060) and fees (£995). The overall cost for comparison is 7.2% APRC representative.",
        "SAP": 1,
        "SharedOwnership": "Not Available",
        "NewBuild": "Also Available for New Build",
        "Offset": false,
        "LtdCompany": "",
        "HMO": false,
        "Channel": "Direct Only",
        "AvailableFor": "Remortgage"
      },
      {
        "ProductId": 619704,
        "LenderId": 23,
        "LenderName": "Furness",
        "DirectToLender": false,
        "ApplyDirectLink": "",
        "LenderURL": "https://assets.landc.co.uk/lender/furness.gif",
        "ProductSchemeFriendlyName": "Fixed for 2 years",
        "Rate": 4.59,
        "FollowOnRate": "then 8.39% (variable)",
        "PMT": 449,
        "FutureValue": 76418.67,
        "FutureMonthlyPayment": 626,
        "TotalFees": 1058,
        "AnnualCost": 5914.12,
        "ApplicationFee": 0,
        "CompletionFee": 999,
        "ValuationFee": 0,
        "OtherFees": 0,
        "Cashback": 250,
        "BrokerFee": 0,
        "OverpaymentLimit": "10% p/a",
        "ERC": "Early Repayment Charges apply",
        "ERCText": "3% reducing to 2% for 2 years",
        "ExitFee": 120,
        "Legals": "LC Conv",
        "MinimumMortgageAmount": 30000,
        "MaximumMortgageAmount": 2000000,
        "LTV": 80,
        "APR": 7.945,
        "FollowOnRateValue": 8.39,
        "SchemeLength": 24,
        "SchemeTypeRefId": 51,
        "IsRemortgage": true,
        "RepresentativeExample": "A mortgage of £80,000 payable over 25 years, initially on a fixed rate for 2 years at 4.59% and then on a variable rate of 8.39% for the remaining 23 years would require 24 payments of £449 and 276 payments of £626. The total amount payable would be £184,310 made up of the loan amount plus interest (£103,252) and fees (£1,058). The overall cost for comparison is 7.9% APRC representative.",
        "SAP": 1,
        "SharedOwnership": "Not Available",
        "NewBuild": "Also Available for New Build",
        "Offset": false,
        "LtdCompany": "",
        "HMO": false,
        "Channel": "Everyone",
        "AvailableFor": "Remortgage"
      }
    ]
  }
}
```

#### HTTP 400 Bad Request

If any validation errors occur a 500 will be returned at present.

We may change this to be in line with minimal enquiry endpoint to give the caller more information as to exactly what data is incorrect.

#### HTTP 500 Internal server error

No full response at present, we may change this to be in line with minimal enquiry endpoint

<small>^ [Back to Top](#website-middle-layer---products-mct-http-endpoint)</small>

---
