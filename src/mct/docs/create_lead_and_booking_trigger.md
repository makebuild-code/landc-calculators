# website middle layer - Create Lead and Booking http endpoint

Last Updated Date : 09/05/2025
Created Date : 09/05/2025

## Contents

- [website middle layer - Create Lead and Booking http endpoint](#website-middle-layer---create-lead-and-booking-http-endpoint)
  - [Contents](#contents)
  - [Base URLs](#base-urls)
  - [Authentication](#authentication)
  - [Security](#security)
  - [\[POST\] api/CreateLeadAndBookingHttpTrigger](#post-apicreateleadandbookinghttptrigger)
    - [parameters](#parameters)
    - [Example Payloads](#example-payloads)
    - [Data validation Rules](#data-validation-rules)
    - [Responses](#responses)
      - [HTTP 202 Accepted](#http-202-accepted)
      - [HTTP 409 Conflict](#http-409-conflict)

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

<small>^ [Back to Top](#website-middle-layer---create-lead-and-booking-http-endpoint)</small>

---

## [POST] api/CreateLeadAndBookingHttpTrigger

Calls internal endpoints:

`/Enquiry/ByLcidAndIcid`  
`/Enquiry/CreateLead`
`/Booking/Link/Token`
`/Booking/Book`

### parameters

ByLcidAndIcid:

```ts
{
	"LCID": GUID,
	"ICID": STRING
}
```

CreateLead:

```ts
{
	"EnquiryLead:"
	{
		"EnquiryId": LONG,
		"Icid": STRING,
		"PartnerId": STRING,
		"FirstName": STRING,
		"Surname": STRING,
		"Email": STRING,
		"Mobile": STRING,
		"PurchasePrice": INT,
		"RepaymentType": CHAR,
		"OfferAccepted": CHAR,
		"MortgageLength": INT,
		"MaximumBudget": INT,
		"BuyerType": STRING,
		"ResiBtl": CHAR,
		"Lender" : STRING,
		"ReadinessToBuy": CHAR,
		"PurchRemo": CHAR,
		"PropertyValue" : INT,
		"DepositAmount": INT,
		"LTV": INT,
		"MortgageType": CHAR,
		"Source": CHAR,
		"SourceId": INT,
		"CreditImpaired": CHAR,
		"IsEmailMarketingPermitted": BOOL,
		"IsPhoneMarketingPermitted": BOOL,
		"IsSMSMarketingPermitted": BOOL,
		"IsPostMarketingPermitted": BOOL,
		"IsSocialMessageMarketingPermitted": BOOL
	}

}
```

Booking/Link/Token:

```ts
{
	"EnquiryId": GUID
}
```

Booking/Link/Book:

```ts
{
	"Source": STRING,
	"bookingDate": DATETIME,
	"BookingStart": STRING,
	"BookingEnd": STRING,
	"BookingProfile": STRING,
	"BookingProfileId": INT,
}
```

### Example Payloads

Create Lead and Booking

```json
{
  "input": {
    "enquiry": {
      "lcid": "0FFA8FAE-1D74-45BE-9CDC-9FAF7783CA07",
      "icid": "G437",
      "PartnerId": 33,
      "FirstName": "FirstName",
      "Surname": "Surname",
      "Email": "Email",
      "Mobile": "Mobile",
      "PurchasePrice": 250000,
      "RepaymentType": "P", // What does "P" mean? Assuming Part repayment part interest. "R" for repayment, "I" for interest-only
      "OfferAccepted": "Y", // Will be "Y" if ReadinessToBuy is "D"?
      "MortgageLength": 25,
      "MaximumBudget": 250000,
      "BuyerType": "BuyerType", // What is buyer type? What are the options?
      "ResiBtl": "R",
      "Lender": "Lender",
      "ReadinessToBuy": "A", // Assuming options are A, B, C or D? Going from A being least ready and D being offer accepted?
      "PurchRemo": "P",
      "PropertyValue": 250000,
      "DepositAmount": 80000,
      "LTV": "99", // What is LTV?
      "MortgageType": "M", // What is MortgageType in this API? In the Products API it is 1 for residential, 2 for buy-to-let. What are the options here?
      "Source": "S", // What should we be putting for the source?
      "SourceId": 77, // Do we need to add this too?
      "CreditImpaired": "N", // "Y" or "N"
      "IsEmailMarketingPermitted": true,
      "IsPhoneMarketingPermitted": true,
      "IsSMSMarketingPermitted": true,
      "IsPostMarketingPermitted": true,
      "IsSocialMessageMarketingPermitted": true
    },
    "booking": {
      "source": "SYSTEM",
      "bookingDate": "2025-05-12T15:15:58.163Z",
      "bookingStart": "10:00",
      "bookingEnd": "11:00",
      "bookingProfile": "DEFAULT",
      "bookingProfileId": 0
    }
  }
}
```

### Data validation Rules

`LCID`, `ICID`, `Booking` MUST be supplied

### Responses

#### HTTP 202 Accepted

```json
{
  "url": "https://integrationdev.landc.co.uk/booking/book",
  "body": "{\"source\":\"SYSTEM\",\"bookingDate\":\"2025-05-12T15:15:58.163Z\",\"bookingStart\":\"10:00\",\"bookingEnd\":\"11:00\",\"bookingProfile\":\"DEFAULT\",\"bookingProfileId\":0}",
  "result": ""
}
```

#### HTTP 409 Conflict

```json
{
  "url": "https://integrationdev.landc.co.uk/booking/book",
  "body": "{\"source\":\"SYSTEM\",\"bookingDate\":\"2025-04-12T15:15:58.163Z\",\"bookingStart\":\"10:00\",\"bookingEnd\":\"11:00\",\"bookingProfile\":\"DEFAULT\",\"bookingProfileId\":0}",
  "error": "Timeslot fully booked"
}
```

<small>^ [Back to Top](#website-middle-layer---create-lead-and-booking-http-endpoint)</small>

---
