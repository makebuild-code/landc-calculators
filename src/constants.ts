const production = true;

export const API_ENDPOINTS = {
  productsTrigger: production
    ? 'https://test.landc.co.uk/api/productshttptrigger'
    : 'https://landc-function-app-faa4.azurewebsites.net/api/ProductsHttpTrigger',
  calculatorTrigger: production
    ? 'https://test.landc.co.uk/api/calculatorhttptrigger'
    : 'https://landc-function-app-faa4.azurewebsites.net/api/CalculatorHttpTrigger?',
  svrForLenders: production
    ? 'https://test.landc.co.uk/api/SVRForLendersTrigger'
    : 'https://landc-function-app-faa4.azurewebsites.net/api/SVRForLendersTrigger',
  costOfDoingNothing: production
    ? 'https://test.landc.co.uk/api/CODNTrigger'
    : 'https://landc-function-app-faa4.azurewebsites.net/api/CODNTrigger',
};
§