import { APIClient } from '../client/APIClient';
import { API_CONFIG } from '$mct/config';
import type { CreateLeadAndBookingRequest, CreateLeadAndBookingResponse } from '$mct/types';

export class CreateLeadAndBookingAPI {
  constructor(private client: APIClient) {}

  async createLeadAndBooking(request: CreateLeadAndBookingRequest): Promise<CreateLeadAndBookingResponse> {
    // const input = { input: request };
    const input = {
      enquiry: {
        lcid: '0FFA8FAE-1D74-45BE-9CDC-9FAF7783CA07',
        icid: 'G437',
        PartnerId: 33,
        FirstName: 'FirstName',
        Surname: 'Surname',
        Email: 'Email',
        Mobile: 'Mobile',
        PurchasePrice: 250000,
        RepaymentType: 'Repayment',
        OfferAccepted: 'Y',
        MortgageLength: 25,
        MaximumBudget: 250000,
        BuyerType: 'BuyerType',
        ResiBtl: 'R',
        Lender: 'Lender',
        ReadinessToBuy: 'A',
        PurchRemo: 'P',
        PropertyValue: 250000,
        DepositAmount: 80000,
        LTV: '99',
        Source: 'S',
        SourceId: 77,
        CreditImpaired: 'N',
        IsEmailMarketingPermitted: true,
        IsPhoneMarketingPermitted: true,
        IsSMSMarketingPermitted: true,
        IsPostMarketingPermitted: true,
        IsSocialMessageMarketingPermitted: true,
      },
      booking: {
        source: 'SYSTEM',
        bookingDate: '2025-07-12T15:15:58.163Z',
        bookingStart: '10:00',
        bookingEnd: '11:00',
        bookingProfile: 'DEFAULT',
        bookingProfileId: 0,
      },
    };
    console.log('CreateLeadAndBooking Request: ', input);
    console.log('CreateLeadAndBooking Endpoint: ', API_CONFIG.endpoints.createLeadAndBooking);
    return this.client.request<CreateLeadAndBookingResponse>(API_CONFIG.endpoints.createLeadAndBooking, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}
