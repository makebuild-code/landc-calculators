# website middle layer - User Event Tracker http endpoint

Last Updated Date : 28/04/2025
Created Date : 24/02/2025

## Contents

- [website middle layer - User Event Tracker http endpoint](#website-middle-layer---user-event-tracker-http-endpoint)
  - [Contents](#contents)
  - [Base URLs](#base-urls)
  - [Authentication](#authentication)
  - [Security](#security)
  - [\[POST\] api/LogEventHttpTrigger (MCT User Event Tracker)](#post-apilogeventhttptrigger-mct-user-event-tracker)
    - [parameters](#parameters)
    - [Example Payloads](#example-payloads)
    - [Data validation Rules](#data-validation-rules)
    - [Responses](#responses)
      - [HTTP 200 OK](#http-200-ok)
      - [HTTP 400 Bad Request](#http-400-bad-request)
      - [HTTP 404 Not Found](#http-404-not-found)

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

<small>^ [Back to Top](#website-middle-layer---user-event-tracker-http-endpoint)</small>

---

## [POST] api/LogEventHttpTrigger (MCT User Event Tracker)

Calls internal endpoint:

`/Enquiry/LogEvent`

### parameters

```ts
{
	"LCID": GUID,
	"ICID": STRING,
	"Event": STRING,
	"FieldName": STRING,
	"FieldValue": STRING,
	"CreatedBy": STRING
}
```

### Example Payloads

Click event for wizard step

```json
{
	"input": {
		"LCID": "2ABC4D8D-689E-4F28-A5A8-00A4F2BA4AC2",
		"ICID": "MCT0102",
		"Event": "User filled in mortgage amount",
		"FieldName": "DepositAmount",
		"FieldValue" "1000",
		"CreatedBy": "MCT"
	}
}
```

Click event for user going 'direct to lender' from product results:

```json
{
  "input": {
    "LCID": "2ABC4D8D-689E-4F28-A5A8-00A4F2BA4AC2",
    "ICID": "MCT0102",
    "Event": "User went direct to lender",
    "FieldName": "LenderName",
    "FieldValue": "First Direct",
    "CreatedBy": "MCT"
  }
}
```

Click event for user going 'direct to broker' from product results:

```json
{
  "input": {
    "LCID": "2ABC4D8D-689E-4F28-A5A8-00A4F2BA4AC2",
    "ICID": "MCT0102",
    "Event": "User went direct to broker",
    "FieldName": null,
    "FieldValue": null,
    "CreatedBy": "MCT"
  }
}
```

### Data validation Rules

`LCID`, `ICID`, `Event` and `CreatedBy` MUST be supplied

### Responses

#### HTTP 200 OK

```json
{
  "url": "https://integrationtest.landc.co.uk/Enquiry/LogEvent",
  "body": "",
  "result": {
    "status": "OK",
    "message": "User Event logged successfully"
  }
}
```

#### HTTP 400 Bad Request

```json
{
  "url": "https://integrationtest.landc.co.uk/Enquiry/LogEvent",
  "body": "{\"LCID\":\"409de1a4-7a1f-44e8-9887-6f384c70a9bf\",\"ICID\":\"MCT0102\",\"Event\":\"\",\"CreatedBy\":\"SYSTEM\"}",
  "error": {
    "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
    "title": "Data Validation Failed check the request and try again",
    "detail": "Check the errors field for details",
    "instance": "POST /Enquiry/LogEvent",
    "errors": {
      "Event": ["Event type must be set"]
    }
  }
}
```

#### HTTP 404 Not Found

```json
{
  "url": "https://integrationtest.landc.co.uk/Enquiry/LogEvent",
  "body": "{\"LCID\":\"409de1a4-7a1f-44e8-9887-6f384c70a9bf\",\"ICID\":\"MCT0102\",\"Event\":\"Click\",\"CreatedBy\":\"SYSTEM\"}",
  "error": {
    "title": "Not Found",
    "status": 404,
    "detail": "Cannot find entity 'enquiry' for key 'LCID' with value of '145b8ace-ae55-4052-914b-591c75cd93f4'"
  }
}
```

<small>^ [Back to Top](#website-middle-layer---user-event-tracker-http-endpoint)</small>

---
