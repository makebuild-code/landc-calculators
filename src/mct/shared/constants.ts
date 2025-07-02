import type { Profile } from './types';

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
    name: 'residential-purchase',
    display: 'Residential Purchase',
    requirements: {
      PurchRemo: 'P',
      FTB: 'N',
      ResiBtl: 'R',
    },
  },
  {
    name: 'ftb-residential-purchase',
    display: 'First Time Buyer - Purchase',
    requirements: {
      PurchRemo: 'P',
      FTB: 'Y',
      ResiBtl: 'R',
    },
  },
  {
    name: 'btl-purchase',
    display: 'Buy to Let - Purchase',
    requirements: {
      PurchRemo: 'P',
      FTB: 'N',
      ResiBtl: 'B',
    },
  },
  {
    name: 'residential-remortgage',
    display: 'Residential - Remortgage',
    requirements: {
      PurchRemo: 'R',
      // FTB: 'N',
      ResiBtl: 'R',
    },
  },
  {
    name: 'btl-remortgage',
    display: 'Buy to Let - Remortgage',
    requirements: {
      PurchRemo: 'R',
      // FTB: 'N',
      ResiBtl: 'B',
    },
  },
];

export const ENDPOINTS = {
  lcid: 'EnquiryHttpTrigger',
  products: 'ProductsMCTHttpTrigger',
  lenders: 'LendersHttpTrigger',
};
