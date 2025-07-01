export function filterAllowed<T extends number>(values: (string | number)[], allowed: readonly T[]): T[] {
  return values.map(Number).filter((v): v is T => allowed.includes(v as T));
}
