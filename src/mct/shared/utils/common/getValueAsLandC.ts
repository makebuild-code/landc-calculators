import { MCTManager } from '$mct/manager';
import {
  CreditImpairedENUM,
  DatePlanToRemoENUM,
  FirstTimeBuyerENUM,
  InputKeysENUM,
  PurchRemoENUM,
  ReadinessToBuyENUM,
  RemoChangeENUM,
  RepaymentTypeENUM,
  ResiBtlENUM,
  SchemePeriodsENUM,
  SchemeTypesENUM,
  StageIDENUM,
  type InputKey,
  type Inputs,
} from '$mct/types';
import { getEnumValue } from '$mct/utils';

// Helper type to extract the value type from an interface
type ExtractValueType<T, K extends keyof T> = T[K];

// Union type for all possible keys (both enum values and literal keys)
type AllKeys = keyof Inputs | (typeof InputKeysENUM)[keyof typeof InputKeysENUM];

// Map of keys to their corresponding enums
type EnumMap = {
  PurchRemo: typeof PurchRemoENUM;
  FTB: typeof FirstTimeBuyerENUM;
  ResiBtl: typeof ResiBtlENUM;
  ReadinessToBuy: typeof ReadinessToBuyENUM;
  CreditImpaired: typeof CreditImpairedENUM;
  RepaymentType: typeof RepaymentTypeENUM;
  SchemeTypes: typeof SchemeTypesENUM;
  SchemePeriods: typeof SchemePeriodsENUM;
  DatePlanToRemo: typeof DatePlanToRemoENUM;
  RemoChange: typeof RemoChangeENUM;
};

// Conditional type that returns the enum values
type GetValueAsLandCReturnType<T extends AllKeys> = T extends keyof EnumMap
  ? EnumMap[T][keyof EnumMap[T]]
  : T extends keyof Inputs
    ? ExtractValueType<Inputs, T>
    : never;

export const getValueAsLandC = <T extends AllKeys>(key: T): GetValueAsLandCReturnType<T> | undefined => {
  const answers = MCTManager.getAnswers();
  const filters = MCTManager.getFilters();
  const currentStage = MCTManager.getCurrentStage();

  let values: Inputs;
  if (currentStage === StageIDENUM.Questions) {
    values = answers;
  } else {
    values = { ...answers, ...filters };
  }

  const value = values[key as InputKey];

  if (!value) return undefined;

  // Return number or boolean values as they are
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value as GetValueAsLandCReturnType<T>;
  }

  // Dynamic enum mapping
  const enumMap: Record<string, any> = {
    PurchRemo: PurchRemoENUM,
    FTB: FirstTimeBuyerENUM,
    ResiBtl: ResiBtlENUM,
    ReadinessToBuy: ReadinessToBuyENUM,
    CreditImpaired: CreditImpairedENUM,
    RepaymentType: RepaymentTypeENUM,
    SchemeTypes: SchemeTypesENUM,
    SchemePeriods: SchemePeriodsENUM,
    DatePlanToRemo: DatePlanToRemoENUM,
    RemoChange: RemoChangeENUM,
  };

  const enumType = enumMap[key as string];
  if (enumType) {
    // Handle array values (like SchemeTypes)
    if (Array.isArray(value)) {
      return value.map((v) => getEnumValue(enumType, v)) as unknown as GetValueAsLandCReturnType<T>;
    }
    // Handle string values
    return getEnumValue(enumType, value as string) as GetValueAsLandCReturnType<T>;
  }

  return value as GetValueAsLandCReturnType<T>;
};
