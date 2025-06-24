// export const PurchRemoToSchemePurposeMap = {
//   Key: 'SchemePurpose',
//   P: 1,
//   R: 2,
// };

// // Map Webflow input values to API values
// export const MortgageTypeMap = {
//   // Webflow value: API value
//   residential: 1,
//   buy_to_let: 2,
//   R: 1, // If Webflow uses "R" for residential
//   B: 2, // If Webflow uses "B" for buy to let
// };

// export const ResiBtlMap = {
//   // Webflow value: API value
//   residential: 'R',
//   buy_to_let: 'B',
//   1: 'R', // If you get 1 from another API
//   2: 'B',
// };

// export const PropertyTypeMap = {
//   house: 1,
//   flat: 2,
//   1: 'house',
//   2: 'flat',
// };

// export const SchemePurposeMap = {
//   purchase: 1,
//   remortgage: 2,
//   1: 'purchase',
//   2: 'remortgage',
// };

// // Add more as needed...

// // Example function to map Webflow input to API payload
// export function mapWebflowToApi(input: any) {
//   return {
//     MortgageType: MortgageTypeMap[input.mortgageType], // e.g. "residential" -> 1
//     ResiBtl: ResiBtlMap[input.mortgageType], // e.g. "residential" -> "R"
//     PropertyType: PropertyTypeMap[input.propertyType], // e.g. "house" -> 1
//     SchemePurpose: SchemePurposeMap[input.schemePurpose], // e.g. "purchase" -> 1
//     // ...other fields
//   };
// }

// const webflowInput = {
//   mortgageType: 'residential',
//   propertyType: 'house',
//   schemePurpose: 'purchase',
//   // ...other fields
// };

// const apiPayload = mapWebflowToApi(webflowInput);
// // apiPayload.MortgageType === 1
// // apiPayload.ResiBtl === "R"
