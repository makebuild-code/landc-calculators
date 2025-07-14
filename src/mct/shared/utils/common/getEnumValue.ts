export const getEnumValue = <T extends Record<string, string | number>>(
  enumObj: T,
  key: string | keyof T
): T[keyof T] | undefined => {
  return enumObj[key as keyof T];
};
