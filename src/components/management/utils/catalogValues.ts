export const isEnabled = (value: unknown) =>
  !(
    typeof value === "object" &&
    value !== null &&
    "enabled" in value &&
    value.enabled === false
  );

export const normalizeNumber = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
