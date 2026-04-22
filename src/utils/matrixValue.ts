export type MatrixShape = "full" | "upper" | "lower";

export const resolveMatrixValue = (
  data: number[][],
  row: number,
  col: number,
  shape: MatrixShape = "full",
) => {
  const direct = data[row]?.[col];
  const mirrored = data[col]?.[row];
  const directIsNumber = Number.isFinite(direct);
  const mirroredIsNumber = Number.isFinite(mirrored);

  if (shape === "upper" && row > col) {
    if (mirroredIsNumber) return mirrored as number;
    return directIsNumber ? (direct as number) : 0;
  }

  if (shape === "lower" && row < col) {
    if (mirroredIsNumber) return mirrored as number;
    return directIsNumber ? (direct as number) : 0;
  }

  if (directIsNumber) return direct as number;
  if (mirroredIsNumber) return mirrored as number;
  return 0;
};
