import { fetchProducts } from '../fetchProducts';
import type { ProductsRequest } from '../types/fetchProducts';

export const testFetchProducts = async () => {
  const input: ProductsRequest = {
    PropertyValue: 250000,
    RepaymentValue: 125000,
    PropertyType: 1,
    MortgageType: 1,
    InterestOnlyValue: 0,
    TermYears: 25,
    SchemePurpose: 1,
    SchemePeriods: [1, 2, 3, 4],
    SchemeTypes: [1, 2],
    NumberOfResults: 3,
    // Features: {
    //   HelpToBuy: false,
    //   Offset: false,
    //   EarlyRepaymentCharge: false,
    //   NewBuild: false,
    // },
    SortColumn: 1,
    // UseStaticApr: false,
    // SapValue: 50,
    // Lenders: '',
    // IncludeRetention: false,
    // RetentionLenderId: ,
  };

  console.log(input);

  try {
    const response = await fetchProducts(input);
    console.log(response);
  } catch (error) {
    console.error('API Error:', error);
  }
};
