import { EPSILON } from "@/networkDerivation/calculations/types";
import type { ConnectivityMatrix,MatrixCellValue } from "@/types/connectivityBundle";
import { getMatrixValue } from "@/utils/connectivityMatrix";

export const isFiniteMatrixValue = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const getFiniteMatrixValueOrNull = (
  matrix: ConnectivityMatrix,
  i: number,
  j: number,
) => {
  const value = getMatrixValue(matrix, i, j);
  return isFiniteMatrixValue(value) ? value : null;
};

export const createFullMatrixData = (
  shape: [number, number],
  callback: (i: number, j: number) => MatrixCellValue,
): MatrixCellValue[][] =>
  Array.from({ length: shape[0] }, (_, i) =>
    Array.from({ length: shape[1] }, (_, j) => callback(i, j)),
  );

export const divideOrNull = (numerator: number, denominator: number, epsilon = EPSILON) => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (Math.abs(denominator) <= epsilon) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
};

export const computePooledStd = (
  stdLeft: number,
  stdRight: number,
  nLeft: number,
  nRight: number,
  epsilon = EPSILON,
) => {
  if (!Number.isFinite(stdLeft) || !Number.isFinite(stdRight)) return null;
  if (nLeft <= 1 || nRight <= 1) return null;
  const variance =
    ((nLeft - 1) * stdLeft * stdLeft + (nRight - 1) * stdRight * stdRight) /
    (nLeft + nRight - 2);
  const pooled = Math.sqrt(variance);
  return Number.isFinite(pooled) && Math.abs(pooled) > epsilon ? pooled : null;
};

export const computeWelchDf = (
  stdLeft: number,
  stdRight: number,
  nLeft: number,
  nRight: number,
) => {
  if (!Number.isFinite(stdLeft) || !Number.isFinite(stdRight)) return null;
  if (nLeft <= 1 || nRight <= 1) return null;
  const leftTerm = (stdLeft * stdLeft) / nLeft;
  const rightTerm = (stdRight * stdRight) / nRight;
  const numerator = (leftTerm + rightTerm) ** 2;
  const denominator =
    (leftTerm * leftTerm) / (nLeft - 1) + (rightTerm * rightTerm) / (nRight - 1);
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  const df = numerator / denominator;
  return Number.isFinite(df) && df > 0 ? df : null;
};
