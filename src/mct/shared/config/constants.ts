import type { Profile } from '$mct/types';
import { ProfileNameENUM } from '$mct/types';

export const mctAttr = {
  mct: 'data-mct',
  stage: 'data-mct-stage',
};

export const classes = {
  active: 'is-active',
  highlight: 'mct_highlight',
};

export const parameters = {
  profile: 'profile',
};

export const PROFILES: Profile[] = [
  {
    name: ProfileNameENUM.ResidentialPurchase,
    display: 'Residential Purchase',
    requirements: {
      PurchRemo: 'Purchase',
      FTB: 'No',
      ResiBtl: 'Residential',
    },
  },
  {
    name: ProfileNameENUM.FtbResidentialPurchase,
    display: 'First Time Buyer - Purchase',
    requirements: {
      PurchRemo: 'Purchase',
      FTB: 'Yes',
      ResiBtl: 'Residential',
    },
  },
  {
    name: ProfileNameENUM.BtlPurchase,
    display: 'Buy to Let - Purchase',
    requirements: {
      PurchRemo: 'Purchase',
      FTB: 'No',
      ResiBtl: 'Btl',
    },
  },
  {
    name: ProfileNameENUM.ResidentialRemortgage,
    display: 'Residential - Remortgage',
    requirements: {
      PurchRemo: 'Remortgage',
      // FTB: 'No',
      ResiBtl: 'Residential',
    },
  },
  {
    name: ProfileNameENUM.BtlRemortgage,
    display: 'Buy to Let - Remortgage',
    requirements: {
      PurchRemo: 'Remortgage',
      // FTB: 'No',
      ResiBtl: 'Btl',
    },
  },
];

export const ENDPOINTS = {
  lcid: 'EnquiryHttpTrigger',
  products: 'ProductsMCTHttpTrigger',
  lenders: 'LendersHttpTrigger',
  mortgageAppointmentSlots: 'GetMortgageAppointmentSlotsTrigger',
  createLeadAndBooking: 'CreateLeadAndBookingHttpTrigger',
  logUserEvents: 'LogEventHttpTrigger',
};
