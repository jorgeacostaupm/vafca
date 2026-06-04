export const formatSummaryNumber = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(Math.abs(value) >= 100 ? 2 : 4);
};

export const formatSummaryPercent = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
};

export const formatSummaryBoolean = (value: boolean) => (value ? "Yes" : "No");
