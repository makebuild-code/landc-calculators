import { getBaseURLForAPI } from '$utils/getBaseURLForAPI';

// Base URL with have the trailing slash
const baseURLForAPI = getBaseURLForAPI();

export const API_ENDPOINTS = {
  productsTrigger: `${baseURLForAPI}productshttptrigger`,
  calculatorTrigger: `${baseURLForAPI}calculatorhttptrigger`,
  svrForLenders: `${baseURLForAPI}SVRForLendersTrigger`,
  costOfDoingNothing: `${baseURLForAPI}CODNTrigger`,
};
