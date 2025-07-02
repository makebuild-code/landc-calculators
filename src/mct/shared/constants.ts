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
      PurchRemo: 'P',
      FTB: 'N',
      ResiBtl: 'R',
    },
  },
  {
    name: ProfileNameENUM.FtbResidentialPurchase,
    display: 'First Time Buyer - Purchase',
    requirements: {
      PurchRemo: 'P',
      FTB: 'Y',
      ResiBtl: 'R',
    },
  },
  {
    name: ProfileNameENUM.BtlPurchase,
    display: 'Buy to Let - Purchase',
    requirements: {
      PurchRemo: 'P',
      FTB: 'N',
      ResiBtl: 'B',
    },
  },
  {
    name: ProfileNameENUM.ResidentialRemortgage,
    display: 'Residential - Remortgage',
    requirements: {
      PurchRemo: 'R',
      // FTB: 'N',
      ResiBtl: 'R',
    },
  },
  {
    name: ProfileNameENUM.BtlRemortgage,
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
