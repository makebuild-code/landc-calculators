import type { Profile } from '../stages/form/types';

export const mctAttr = {
  mct: 'data-mct',
  stage: 'data-mct-stage',
};

export const classes = {
  active: 'is-active',
};

export const PROFILES: Profile[] = [
  {
    name: 'residential-purchase',
    display: 'Residential Purchase',
    requirements: {
      PurchRemo: 'P',
      BuyerType: 'N',
      ResiBtl: 'R',
    },
  },
  {
    name: 'ftb-residential-purchase',
    display: 'First Time Buyer - Purchase',
    requirements: {
      PurchRemo: 'P',
      BuyerType: 'Y',
      ResiBtl: 'R',
    },
  },
  {
    name: 'btl-purchase',
    display: 'Buy to Let - Purchase',
    requirements: {
      PurchRemo: 'P',
      BuyerType: 'N',
      ResiBtl: 'B',
    },
  },
  {
    name: 'residential-remortgage',
    display: 'Residential - Remortgage',
    requirements: {
      PurchRemo: 'R',
      BuyerType: 'N',
      ResiBtl: 'R',
    },
  },
  {
    name: 'btl-remortgage',
    display: 'Buy to Let - Remortgage',
    requirements: {
      PurchRemo: 'R',
      BuyerType: 'N',
      ResiBtl: 'B',
    },
  },
];
