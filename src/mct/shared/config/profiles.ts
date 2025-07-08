import type { CONFIG_PROFILES } from '$mct/types';
import { ProfileNameENUM } from '$mct/types';

export const PROFILES_CONFIG: CONFIG_PROFILES = {
  profiles: [
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
  ],
};
