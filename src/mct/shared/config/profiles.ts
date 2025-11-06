import type { CONFIG_PROFILES } from '$mct/types';
import { BuyerTypeENUM, FirstTimeBuyerENUM, ProfileNameENUM, PurchRemoENUM, ResiBtlENUM } from '$mct/types';
import { getEnumKey } from '$mct/utils';

export const PROFILES_CONFIG: CONFIG_PROFILES = {
  profiles: [
    {
      name: ProfileNameENUM.ResidentialPurchase,
      display: BuyerTypeENUM.ResidentialPurchase,
      requirements: {
        // PurchRemo: 'Purchase', FTB: 'No', ResiBtl: 'Residential',
        PurchRemo: getEnumKey(PurchRemoENUM, PurchRemoENUM.Purchase),
        FTB: getEnumKey(FirstTimeBuyerENUM, FirstTimeBuyerENUM.No),
        ResiBtl: getEnumKey(ResiBtlENUM, ResiBtlENUM.Residential),
      },
    },
    {
      name: ProfileNameENUM.BtlPurchase,
      display: BuyerTypeENUM.BtlPurchase,
      requirements: {
        // PurchRemo: 'Purchase', FTB: 'No', ResiBtl: 'Btl',
        PurchRemo: getEnumKey(PurchRemoENUM, PurchRemoENUM.Purchase),
        FTB: getEnumKey(FirstTimeBuyerENUM, FirstTimeBuyerENUM.No),
        ResiBtl: getEnumKey(ResiBtlENUM, ResiBtlENUM.Btl),
      },
    },
    {
      name: ProfileNameENUM.FtbResidentialPurchase,
      display: BuyerTypeENUM.FtbResidentialPurchase,
      requirements: {
        // PurchRemo: 'Purchase', FTB: 'Yes', ResiBtl: 'Residential',
        PurchRemo: getEnumKey(PurchRemoENUM, PurchRemoENUM.Purchase),
        FTB: getEnumKey(FirstTimeBuyerENUM, FirstTimeBuyerENUM.Yes),
        ResiBtl: getEnumKey(ResiBtlENUM, ResiBtlENUM.Residential),
      },
    },
    {
      name: ProfileNameENUM.FtbBtlPurchase,
      display: BuyerTypeENUM.FtbBtlPurchase,
      requirements: {
        // PurchRemo: 'Purchase', FTB: 'Yes', ResiBtl: 'Btl',
        PurchRemo: getEnumKey(PurchRemoENUM, PurchRemoENUM.Purchase),
        FTB: getEnumKey(FirstTimeBuyerENUM, FirstTimeBuyerENUM.Yes),
        ResiBtl: getEnumKey(ResiBtlENUM, ResiBtlENUM.Btl),
      },
    },
    {
      name: ProfileNameENUM.ResidentialRemortgage,
      display: BuyerTypeENUM.ResidentialRemortgage,
      requirements: {
        // PurchRemo: 'Remortgage', ResiBtl: 'Residential',
        PurchRemo: getEnumKey(PurchRemoENUM, PurchRemoENUM.Remortgage),
        ResiBtl: getEnumKey(ResiBtlENUM, ResiBtlENUM.Residential),
      },
    },
    {
      name: ProfileNameENUM.BtlRemortgage,
      display: BuyerTypeENUM.BtlRemortgage,
      requirements: {
        // PurchRemo: 'Remortgage', ResiBtl: 'Btl',
        PurchRemo: getEnumKey(PurchRemoENUM, PurchRemoENUM.Remortgage),
        ResiBtl: getEnumKey(ResiBtlENUM, ResiBtlENUM.Btl),
      },
    },
  ],
};
