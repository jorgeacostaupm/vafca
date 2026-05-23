import type {
  Atlas,
  MatrixCellValue,
  MatrixData,
  MatrixLayout,
  MatrixRecord,
} from "@/types/connectivityBundle";

const assertShape = (matrix: MatrixRecord) => {
  const [rows, cols] = matrix.geometry.shape;
  if (rows !== cols) {
    throw new Error(`Matrix '${matrix.id}' is not square.`);
  }
  return rows;
};

export const getExpectedDataLength = (matrix: MatrixRecord): number => {
  const [rows] = matrix.geometry.shape;
  if (matrix.encoding.layout === "full") return rows;
  const size = assertShape(matrix);
  return (size * (size + 1)) / 2;
};

export const getTriangularIndex = (
  i: number,
  j: number,
  n: number,
  layout: MatrixLayout,
): number => {
  if (layout === "upper_triangular") {
    if (i > j) throw new Error("Upper triangular index requires i <= j.");
    return i * n - (i * (i - 1)) / 2 + (j - i);
  }
  if (layout === "lower_triangular") {
    if (i < j) throw new Error("Lower triangular index requires i >= j.");
    return (i * (i + 1)) / 2 + j;
  }
  throw new Error("Triangular index is not valid for full layout.");
};

const assertBounds = (matrix: MatrixRecord, i: number, j: number) => {
  const [rows, cols] = matrix.geometry.shape;
  if (i < 0 || j < 0 || i >= rows || j >= cols) {
    throw new Error(`Matrix indices (${i}, ${j}) are out of range.`);
  }
};

export const getMatrixValue = (
  matrix: MatrixRecord,
  i: number,
  j: number,
): MatrixCellValue => {
  assertBounds(matrix, i, j);
  const { layout, symmetric, missingValue } = matrix.encoding;
  if (layout === "full") return (matrix.data as MatrixCellValue[][])[i][j];

  const n = assertShape(matrix);
  const values = matrix.data as MatrixCellValue[];
  if (layout === "upper_triangular") {
    if (i <= j) return values[getTriangularIndex(i, j, n, layout)];
    if (symmetric) return values[getTriangularIndex(j, i, n, layout)];
  }
  if (layout === "lower_triangular") {
    if (i >= j) return values[getTriangularIndex(i, j, n, layout)];
    if (symmetric) return values[getTriangularIndex(j, i, n, layout)];
  }
  throw new Error(
    missingValue === null
      ? "Cannot read the unstored side of a non-symmetric triangular matrix."
      : "Unsupported triangular matrix access.",
  );
};

export const setMatrixValue = (
  matrix: MatrixRecord,
  i: number,
  j: number,
  value: MatrixCellValue,
) => {
  if (matrix.encoding.layout !== "full") {
    throw new Error("setMatrixValue is only supported for full layout in v1.0.");
  }
  assertBounds(matrix, i, j);
  (matrix.data as MatrixCellValue[][])[i][j] = value;
};

export type MatrixEdge = {
  i: number;
  j: number;
  value: MatrixCellValue;
};

export function* iterateMatrixEdges(matrix: MatrixRecord): Generator<MatrixEdge> {
  const [rows, cols] = matrix.geometry.shape;
  for (let i = 0; i < rows; i += 1) {
    const start = matrix.encoding.symmetric ? i : 0;
    for (let j = start; j < cols; j += 1) {
      yield { i, j, value: getMatrixValue(matrix, i, j) };
    }
  }
}

export const computeRoiOrderHash = (atlas: Atlas): string => {
  const source = [...atlas.rois]
    .sort((a, b) => a.index - b.index)
    .map((roi) => `${roi.index}:${roi.id}:${String(roi.atlasId)}`)
    .join("|");

  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

export const compareGeometryCompatibility = (
  matrixA: MatrixRecord,
  matrixB: MatrixRecord,
  atlasA: Atlas,
  atlasB: Atlas,
) => {
  const sameAtlas = matrixA.geometry.atlasId === matrixB.geometry.atlasId;
  const sameShape =
    matrixA.geometry.shape[0] === matrixB.geometry.shape[0] &&
    matrixA.geometry.shape[1] === matrixB.geometry.shape[1];
  const sameRoiOrder = computeRoiOrderHash(atlasA) === computeRoiOrderHash(atlasB);
  const supportedLayouts = [matrixA, matrixB].every((matrix) =>
    ["full", "upper_triangular", "lower_triangular"].includes(
      matrix.encoding.layout,
    ),
  );

  return {
    compatible: sameAtlas && sameShape && sameRoiOrder && supportedLayouts,
    reasons: [
      !sameAtlas ? "atlasId differs" : null,
      !sameShape ? "shape differs" : null,
      !sameRoiOrder ? "roiOrderHash differs" : null,
      !supportedLayouts ? "unsupported layout" : null,
    ].filter((reason): reason is string => reason !== null),
  };
};

export const materializeMatrixData = (matrix: MatrixRecord): number[][] => {
  const [rows, cols] = matrix.geometry.shape;
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => {
      const value = getMatrixValue(matrix, i, j);
      return value ?? Number.NaN;
    }),
  );
};

export const isMatrixData = (data: unknown): data is MatrixData =>
  Array.isArray(data);
