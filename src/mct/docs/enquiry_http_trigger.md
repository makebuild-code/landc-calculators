
# website middle layer - New Enquiry http endpoint

Last Updated Date : 20/06/2025
Created Date : 20/06/2025

## Contents

- [website middle layer - New Enquiry http endpoint](#website-middle-layer---new-enquiry-http-endpoint)
	- [Contents](#contents)
	- [Base URLs](#base-urls)
	- [Authentication](#authentication)
	- [Security](#security)
	- [\[POST\] api/EnquiryHttpTrigger (MCT New Enquiry)](#post-apienquiryhttptrigger-mct-new-enquiry)
		- [parameters](#parameters)
		- [Example Payloads](#example-payloads)
		- [Data validation Rules](#data-validation-rules)
		- [Responses](#responses)
			- [HTTP 200 OK](#http-200-ok)
			- [HTTP 400 Bad Request](#http-400-bad-request)

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

<small>^ [Back to Top](#website-middle-layer---new-enquiry-http-endpoint)</small>

---

## [POST] api/EnquiryHttpTrigger (MCT New Enquiry)

Calls internal endpoint:  

`/Enquiry/NewEnquiry`

### parameters

```ts
{
	"LCID": GUID,
	"ICID": STRING,
	"PartnerId": STRING,
	"PartnerName": STRING
}
```
### Example Payloads

New Enquiry

```json
{
	"endpoint": "NewEnquiry",
	"input": {
		  	"lcid": null,
			"icid": "default",
			"partnerId": "",
			"partnerName": ""
	}
}
```  

Existing LCID

```json
{
	"endpoint": "NewEnquiry",
	"input": {
		  	"lcid": "6b68222f-4f39-40d7-a57e-45eeb245da6c",
			"icid": "default",
			"partnerId": "",
			"partnerName": ""
	}
}
```  

### Data validation Rules

`LCID` be supplied AND either `ICID` OR ( `PartnerName` and `PartnerId` ) MUST be supplied

### Responses

#### HTTP 200 OK

```json
{
	"url": "https://integrationtest.landc.co.uk/Enquiry/NewEnquiry",
	"body": "",
	"result": {
		"enquiryId": 1385606822320144384,
		"lcid": "40ffdb49-8360-4743-af16-a2483b7d2900",
		"icid": "default"
	}
}
```  

#### HTTP 400 Bad Request  

```json
{
	"url": "https://integrationtest.landc.co.uk/Enquiry/NewEnquiry",
	"error": {
		"type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
		"title": "Data Validation Failed check the request and try again",
		"detail": "Check the errors field for details",
		"instance": "POST /Enquiry/NewEnquiry",
		"errors": {
			"Event": ["Either Icid (Inbound Contact Identifier) must be provided, and/or both PartnerId and PartnerName must be provided."]
		}
	}
}
```  
<small>^ [Back to Top](#website-middle-layer---new-enquiry-http-endpoint)</small>

---