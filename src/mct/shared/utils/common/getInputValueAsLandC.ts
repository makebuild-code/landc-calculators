import { MCTManager } from '$mct/manager';
import {
  CreditImpairedENUM,
  EndOfTermENUM,
  FirstTimeBuyerENUM,
  InputKeysENUM,
  PurchRemoENUM,
  ReadinessToBuyENUM,
  RemoChangeENUM,
  RepaymentTypeENUM,
  ResiBtlENUM,
  SchemePeriodsENUM,
  SchemeTypesENUM,
  type InputKey,
  type Inputs,
  type InputValue,
} from '$mct/types';
import { getEnumValue } from '$mct/utils';

// Helper type to extract the value type from an interface
type ExtractValueType<T, K extends keyof T> = T[K];

// Union type for all possible keys (both enum values and literal keys)
type AllKeys = keyof Inputs | (typeof InputKeysENUM)[keyof typeof InputKeysENUM];

// Conditional type that returns the correct type based on the Inputs interface
type GetValueAsLandCReturnType<T extends AllKeys> = T extends keyof Inputs
  ? ExtractValueType<Inputs, T>
  : T extends (typeof InputKeysENUM)[keyof typeof InputKeysENUM]
    ? ExtractValueType<Inputs, T>
    : never;

export const getInputValueAsLandC = <T extends AllKeys>(key: T): GetValueAsLandCReturnType<T> | undefined => {
  const value = MCTManager.getAnswer(key as InputKey) as InputValue | undefined;
  if (!value) return undefined;

  // Return number or boolean values as they are
  if (typeof value === 'number' || typeof value === 'boolean') return value as GetValueAsLandCReturnType<T>;

  // Resolve array values first (convert enum keys to enum values)
  if (Array.isArray(value)) {
    switch (key) {
      case InputKeysENUM.SchemeTypes:
      case 'SchemeTypes':
        return value.map(
          (v) => getEnumValue(SchemeTypesENUM, v) as SchemeTypesENUM
        ) as unknown as GetValueAsLandCReturnType<T>;
      default:
        return value as unknown as GetValueAsLandCReturnType<T>;
    }
  }

  // Resolve string values (convert enum keys to enum values)
  switch (key) {
    case InputKeysENUM.PurchRemo:
    case 'PurchRemo':
      return getEnumValue(PurchRemoENUM, value) as GetValueAsLandCReturnType<T>;

    case InputKeysENUM.FTB:
    case 'FTB':
      return getEnumValue(FirstTimeBuyerENUM, value) as GetValueAsLandCReturnType<T>;

    case InputKeysENUM.ResiBtl:
    case 'ResiBtl':
      return getEnumValue(ResiBtlENUM, value) as GetValueAsLandCReturnType<T>;

    case InputKeysENUM.ReadinessToBuy:
    case 'ReadinessToBuy':
      return getEnumValue(ReadinessToBuyENUM, value) as GetValueAsLandCReturnType<T>;

    case InputKeysENUM.CreditImpaired:
    case 'CreditImpaired':
      return getEnumValue(CreditImpairedENUM, value) as GetValueAsLandCReturnType<T>;

    case InputKeysENUM.RepaymentType:
    case 'RepaymentType':
      return getEnumValue(RepaymentTypeENUM, value) as GetValueAsLandCReturnType<T>;

    case InputKeysENUM.SchemePeriods:
    case 'SchemePeriods':
      return getEnumValue(SchemePeriodsENUM, value) as GetValueAsLandCReturnType<T>;

    case InputKeysENUM.EndOfTerm:
    case 'EndOfTerm':
      return getEnumValue(EndOfTermENUM, value) as GetValueAsLandCReturnType<T>;

    case InputKeysENUM.RemoChange:
    case 'RemoChange':
      return getEnumValue(RemoChangeENUM, value) as GetValueAsLandCReturnType<T>;

    default:
      return value as GetValueAsLandCReturnType<T>;
  }
};
