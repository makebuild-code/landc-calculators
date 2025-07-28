# website middle layer - Lender List http endpoint

Last Updated Date : 28/04/2025
Created Date : 28/04/2025

## Contents

- [website middle layer - Lender List http endpoint](#website-middle-layer---lender-list-http-endpoint)
  - [Contents](#contents)
  - [Base URLs](#base-urls)
  - [Authentication](#authentication)
  - [Security](#security)
  - [\[GET\] api/LendersHttpTrigger](#get-apilendershttptrigger)
    - [parameters (query string)](#parameters-query-string)
    - [Example Payloads](#example-payloads)
    - [Data validation Rules](#data-validation-rules)
    - [Responses](#responses)
      - [HTTP 200 OK](#http-200-ok)
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

<small>^ [Back to Top](#website-middle-layer---mortgage-appintment-slots-http-endpoint)</small>

---

## [GET] api/LendersHttpTrigger

`/LendersHttpTrigger`

### parameters (query string)

None.

### Example Payloads

`LendersHttpTrigger`

https://func-webapi-landc-dev.azurewebsites.net/api/LendersHttpTrigger

### Data validation Rules

None.

### Responses

#### HTTP 200 OK

```json
{
  "lenders": [
    {
      "MasterLenderId": 1,
      "ResidentialLenderId": 7,
      "BTLLenderId": 93,
      "LenderName": "Accord",
      "LenderImageURL": null,
      "LenderKey": null
    },
    {
      "MasterLenderId": 2,
      "ResidentialLenderId": 8,
      "BTLLenderId": 94,
      "LenderName": "Aldermore",
      "LenderImageURL": null,
      "LenderKey": null
    },
    {
      "MasterLenderId": 3,
      "ResidentialLenderId": 58,
      "BTLLenderId": 144,
      "LenderName": "Axis Bank",
      "LenderImageURL": null,
      "LenderKey": null
    }
  ]
}
```

#### HTTP 500 Internal server error

<small>^ [Back to Top](#website-middle-layer---Lender-List-http-endpoint)</small>

---
