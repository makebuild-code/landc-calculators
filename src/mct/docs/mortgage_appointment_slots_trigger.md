# website middle layer - mortgage appintment slots http endpoint

Last Updated Date : 03/03/2025

Created Date : 24/02/2025

## Contents

- [Base URL](#base-urls)
- [Authentication](#authentication)
- [Security](#security)
- [[GET] api/GetMortgageAppointmentSlotsTrigger](#get-apigetmortgageappointmentslotstrigger)
  - [Parameters](#parameters)
  - [Example Payloads](#example-payloads)
  - [Data validation Rules](#data-validation-rules)
  - [Responses](#responses)
    - [200 OK](#http-200-ok)
    - [400 Bad Request](#http-400-bad-request)
    - [500 Internal server error](#http-500-internal-server-error)

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

## [GET] api/GetMortgageAppointmentSlotsTrigger

`/GetMortgageAppointmentSlotsTrigger?dateFrom=2025-2-21&dateTo=2025-2-22`

### parameters (query string)

As this is a GET it uses URL query parameters `dateFrom` and `dateTo`

e.g. `dateFrom=2025-2-21&dateTo=2025-2-22` as below:

### Example Payloads

`GetMortgageAppointmentSlotsTrigger?dateFrom=2025-2-26&dateTo=2025-2-27`

https://func-webapi-landc-dev.azurewebsites.net/api/GetMortgageAppointmentSlotsTrigger?dateFrom=2025-2-26&dateTo=2025-2-27

### Data validation Rules

1. DateFrom MUST be in the future, after today
2. DateTo MUST be after DateFrom

### Responses

#### HTTP 200 OK

```json
{
  "urlcalled": "https://integrationdev.landc.co.uk/booking/TimeSlot?BookingProfileName=DEFAULT&DateFrom=2025-2-26&DateTo=2025-2-27",
  "result": [
    {
      "date": "2025-02-26T00:00:00",
      "slots": [
        {
          "startTime": "03:00:00",
          "endTime": "04:00:00",
          "capacity": 100,
          "enabled": true
        },
        {
          "startTime": "09:00:00",
          "endTime": "10:00:00",
          "capacity": 62,
          "enabled": true
        }
      ]
    }
  ],
  "paramvalues": "2025-2-26"
}
```

#### HTTP 400 Bad Request

If any validation errors occur a 500 will be returned at present.

We may change this to be in line with minimal lead endpoint to give the caller more information as to exactly what data is incorrect.

#### HTTP 500 Internal server error

No full response at present, we may change this to be in line with minimal lead endpoint

<small>^ [Back to Top](#website-middle-layer---mortgage-appintment-slots-http-endpoint)</small>

---
