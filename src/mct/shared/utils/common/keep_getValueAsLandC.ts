import { MCTManager } from '$mct/manager';
import {
  CreditImpairedENUM,
  EndOfTermENUM,
  FirstTimeBuyerENUM,
  MortgageTypeENUM,
  PropertyTypeENUM,
  PurchRemoENUM,
  ReadinessToBuyENUM,
  RemoChangeENUM,
  RepaymentTypeENUM,
  ResiBtlENUM,
  SapValueENUM,
  SchemePeriodsENUM,
  SchemePurposeENUM,
  SchemeTypesENUM,
  SortColumnENUM,
  type Inputs,
  type ProductsRequestFeatures,
  type ProductsRequest,
  InputKeysENUM,
  ProductsRequestENUM,
  ProductsRequestFeaturesENUM,
  type CalculationKey,
  type InputKey,
  type InputValue,
  type CalculationValue,
} from '$mct/types';
import { getEnumValue } from '$mct/utils';

// Helper type to extract the value type from an interface
type ExtractValueType<T, K extends keyof T> = T[K];

// Union type for all possible keys (both enum values and literal keys)
type AllKeys =
  | keyof Inputs
  | keyof ProductsRequest
  | keyof ProductsRequestFeatures
  | (typeof InputKeysENUM)[keyof typeof InputKeysENUM]
  | (typeof ProductsRequestENUM)[keyof typeof ProductsRequestENUM]
  | (typeof ProductsRequestFeaturesENUM)[keyof typeof ProductsRequestFeaturesENUM];

// Conditional type that returns the correct type based on the source interface
type GetValueAsLandCReturnType<T extends AllKeys> =
  // Prioritize ProductsRequest interface for keys that exist in both
  T extends keyof ProductsRequest
    ? ExtractValueType<ProductsRequest, T>
    : T extends keyof ProductsRequestFeatures
      ? ExtractValueType<ProductsRequestFeatures, T>
      : T extends keyof Inputs
        ? ExtractValueType<Inputs, T>
        : T extends (typeof ProductsRequestENUM)[keyof typeof ProductsRequestENUM]
          ? ExtractValueType<ProductsRequest, T>
          : T extends (typeof ProductsRequestFeaturesENUM)[keyof typeof ProductsRequestFeaturesENUM]
            ? ExtractValueType<ProductsRequestFeatures, T>
            : T extends (typeof InputKeysENUM)[keyof typeof InputKeysENUM]
              ? ExtractValueType<Inputs, T>
              : never;

export const getValueAsLandC = <T extends AllKeys>(key: T): GetValueAsLandCReturnType<T> | undefined => {
  const value = MCTManager.getAnswer(key as InputKey) as InputValue | undefined;
  if (!value) return undefined;

  // const inputs = {
  // PurchRemo?: keyof typeof PurchRemoENUM; // will have by the end
  // FTB?: keyof typeof FirstTimeBuyerENUM;
  // ResiBtl?: keyof typeof ResiBtlENUM; // will have by the end
  // ReadinessToBuy?: keyof typeof ReadinessToBuyENUM;
  // CreditImpaired?: keyof typeof CreditImpairedENUM;
  // PropertyValue?: number; // will have by the end
  // // [AnswerKeysENUM.PropertyType]?: keyof typeof PropertyTypeENUM;
  // DepositAmount?: number;
  // RepaymentType?: keyof typeof RepaymentTypeENUM; // will have by the end
  // InterestOnlyValue?: number; // optional?
  // MortgageLength?: number; // will have by the end
  // SchemeTypes?: keyof (typeof SchemeTypesENUM)[]; // will have by the end
  // SchemePeriods?: keyof typeof SchemePeriodsENUM; // will have by the end
  // EndOfTerm?: keyof typeof EndOfTermENUM;
  // RepaymentValue?: number; // will have by the end
  // RemoChange?: keyof typeof RemoChangeENUM;
  // Lender?: string;
  // }

  // Return number or boolean values as they are
  if (typeof value === 'number' || typeof value === 'boolean') return value as GetValueAsLandCReturnType<T>;

  // Resolve array values first
  if (Array.isArray(value)) {
    switch (key) {
      case ProductsRequestENUM.SchemeTypes:
      case 'SchemeTypes':
        return value.map((v) => getEnumValue(SchemeTypesENUM, v) as SchemeTypesENUM) as GetValueAsLandCReturnType<T>;
      // case ProductsRequestENUM.SchemePeriods:
      // case 'SchemePeriods':
      //   return value.map(
      //     (v) => getEnumValue(SchemePeriodsENUM, v) as SchemePeriodsENUM
      //   ) as GetValueAsLandCReturnType<T>;
      default:
        return value as GetValueAsLandCReturnType<T>;
    }
  }

  // Resolve string values
  switch (key) {
    case InputKeysENUM.CreditImpaired:
    case 'CreditImpaired':
      return getEnumValue(CreditImpairedENUM, value) as GetValueAsLandCReturnType<T>;
    case InputKeysENUM.EndOfTerm:
    case 'EndOfTerm':
      return getEnumValue(EndOfTermENUM, value) as GetValueAsLandCReturnType<T>;
    case InputKeysENUM.FTB:
    case 'FTB':
      return getEnumValue(FirstTimeBuyerENUM, value) as GetValueAsLandCReturnType<T>;
    case InputKeysENUM.PurchRemo:
    case 'PurchRemo':
      return getEnumValue(PurchRemoENUM, value) as GetValueAsLandCReturnType<T>;
    case InputKeysENUM.ReadinessToBuy:
    case 'ReadinessToBuy':
      return getEnumValue(ReadinessToBuyENUM, value) as GetValueAsLandCReturnType<T>;
    case InputKeysENUM.RemoChange:
    case 'RemoChange':
      return getEnumValue(RemoChangeENUM, value) as GetValueAsLandCReturnType<T>;
    case InputKeysENUM.RepaymentType:
    case 'RepaymentType':
      return getEnumValue(RepaymentTypeENUM, value) as GetValueAsLandCReturnType<T>;
    case InputKeysENUM.ResiBtl:
    case 'ResiBtl':
      return getEnumValue(ResiBtlENUM, value) as GetValueAsLandCReturnType<T>;
    case ProductsRequestENUM.MortgageType:
    case 'MortgageType':
      return getEnumValue(MortgageTypeENUM, value) as GetValueAsLandCReturnType<T>;
    case ProductsRequestENUM.SapValue:
    case 'SapValue':
      return getEnumValue(SapValueENUM, value) as GetValueAsLandCReturnType<T>;
    case ProductsRequestENUM.SchemePeriods:
    case 'SchemePeriods':
      return getEnumValue(SchemePeriodsENUM, value) as GetValueAsLandCReturnType<T>;
    case ProductsRequestENUM.SchemePurpose:
    case 'SchemePurpose':
      return getEnumValue(SchemePurposeENUM, value) as GetValueAsLandCReturnType<T>;
    case ProductsRequestENUM.SortColumn:
    case 'SortColumn':
      return getEnumValue(SortColumnENUM, value) as GetValueAsLandCReturnType<T>;
    case ProductsRequestFeaturesENUM.NewBuild:
    case 'NewBuild':
      return (value === 'true' ? true : value === 'false' ? false : undefined) as GetValueAsLandCReturnType<T>;
    case ProductsRequestFeaturesENUM.HelpToBuy:
    case 'HelpToBuy':
      return (value === 'true' ? true : value === 'false' ? false : undefined) as GetValueAsLandCReturnType<T>;
    case ProductsRequestFeaturesENUM.Offset:
    case 'Offset':
      return (value === 'true' ? true : value === 'false' ? false : undefined) as GetValueAsLandCReturnType<T>;
    case ProductsRequestFeaturesENUM.EarlyRepaymentCharge:
    case 'EarlyRepaymentCharge':
      return (value === 'true' ? true : value === 'false' ? false : undefined) as GetValueAsLandCReturnType<T>;
    default:
      return value as GetValueAsLandCReturnType<T>;
  }
};
