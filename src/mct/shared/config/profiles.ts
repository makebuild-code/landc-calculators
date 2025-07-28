import type { CONFIG_PROFILES } from '$mct/types';
import { BuyerTypeENUM, ProfileNameENUM } from '$mct/types';

export const PROFILES_CONFIG: CONFIG_PROFILES = {
  profiles: [
    {
      name: ProfileNameENUM.ResidentialPurchase,
      display: BuyerTypeENUM.ResidentialPurchase,
      requirements: {
        PurchRemo: 'Purchase',
        FTB: 'No',
        ResiBtl: 'Residential',
      },
    },
    {
      name: ProfileNameENUM.BtlPurchase,
      display: BuyerTypeENUM.BtlPurchase,
      requirements: {
        PurchRemo: 'Purchase',
        FTB: 'No',
        ResiBtl: 'Btl',
      },
    },
    {
      name: ProfileNameENUM.FtbResidentialPurchase,
      display: BuyerTypeENUM.FtbResidentialPurchase,
      requirements: {
        PurchRemo: 'Purchase',
        FTB: 'Yes',
        ResiBtl: 'Residential',
      },
    },
    {
      name: ProfileNameENUM.FtbBtlPurchase,
      display: BuyerTypeENUM.FtbBtlPurchase,
      requirements: {
        PurchRemo: 'Purchase',
        FTB: 'Yes',
        ResiBtl: 'Btl',
      },
    },
    {
      name: ProfileNameENUM.ResidentialRemortgage,
      display: BuyerTypeENUM.ResidentialRemortgage,
      requirements: {
        PurchRemo: 'Remortgage',
        ResiBtl: 'Residential',
      },
    },
    {
      name: ProfileNameENUM.BtlRemortgage,
      display: BuyerTypeENUM.BtlRemortgage,
      requirements: {
        PurchRemo: 'Remortgage',
        ResiBtl: 'Btl',
      },
    },
  ],
};
