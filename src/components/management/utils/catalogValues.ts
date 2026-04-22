export const isEnabled = (value: { enabled?: boolean } | undefined) =>
  value?.enabled !== false;

export const normalizeNumber = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
