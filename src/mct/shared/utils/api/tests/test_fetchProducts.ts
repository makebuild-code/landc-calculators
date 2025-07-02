import type { ProductsRequest } from '$mct/types';
import { fetchProducts } from '../calls/fetchProducts';

export const testFetchProducts = async () => {
  const input: ProductsRequest = {
    PropertyValue: 250000,
    RepaymentValue: 125000,
    PropertyType: 1,
    MortgageType: 1,
    InterestOnlyValue: 0,
    TermYears: 25,
    SchemePurpose: 1,
    SchemePeriods: [1],
    SchemeTypes: [1, 2],
    NumberOfResults: 100,
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

  console.log('input', input);

  try {
    const response = await fetchProducts(input);
    console.log(response);
  } catch (error) {
    console.error('API Error:', error);
  }
};

// Run the test if this file is executed directly (ESM compatible)
if (
  typeof process !== 'undefined' &&
  process?.cwd &&
  import.meta.url === `file://${process.cwd()}/src/mct/shared/api/tests/test_fetchProducts.ts`
) {
  testFetchProducts();
}

// npx tsx src/mct/shared/api/tests/test_fetchProducts.ts
