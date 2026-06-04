export const resolveMatrixValue = (
  data: number[][],
  row: number,
  col: number,
) => {
  const value = data[row]?.[col];
  return Number.isFinite(value) ? (value as number) : Number.NaN;
};
