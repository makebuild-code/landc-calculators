export const getEnumKey = <T extends Record<string, string | number>>(enumObj: T, value: T[keyof T]): keyof T => {
  return Object.keys(enumObj).find((key) => enumObj[key as keyof T] === value) as keyof T;
};
