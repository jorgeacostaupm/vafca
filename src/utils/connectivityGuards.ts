export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const isInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

export const isPositiveInteger = (value: unknown): value is number =>
  isInteger(value) && value > 0;

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const hasOwn = (
  value: Record<string, unknown>,
  key: string,
): boolean => Object.prototype.hasOwnProperty.call(value, key);
