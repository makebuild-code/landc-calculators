const production = false;

export const API_ENDPOINTS = {
  productsTrigger: production
    ? 'https://landc.co.uk/api/ProductsHttpTrigger'
    : 'https://test.landc.co.uk/api/productshttptrigger',
  calculatorTrigger: production
    ? 'https://landc.co.uk/api/CalculatorHttpTrigger?'
    : 'https://test.landc.co.uk/api/calculatorhttptrigger',
  svrForLenders: production
    ? 'https://landc.co.uk/api/SVRForLendersTrigger'
    : 'https://test.landc.co.uk/api/SVRForLendersTrigger',
  costOfDoingNothing: production
    ? 'https://landc.co.uk/api/CODNTrigger'
    : 'https://test.landc.co.uk/api/CODNTrigger',
};
