import type {
  MatrixDataStats,
  MatrixDataStatsBucket,
  MatrixRecord,
} from "@/types/connectivityBundle";
import { getMatrixValue } from "@/utils/connectivityMatrix";

const emptyBucket = (): MatrixDataStatsBucket => ({
  min: null,
  max: null,
  absMax: null,
  finiteCount: 0,
  nullCount: 0,
});

const addValue = (bucket: MatrixDataStatsBucket, value: number | null) => {
  if (value === null || !Number.isFinite(value)) {
    bucket.nullCount += 1;
    return;
  }

  bucket.min = bucket.min === null ? value : Math.min(bucket.min, value);
  bucket.max = bucket.max === null ? value : Math.max(bucket.max, value);
  bucket.absMax =
    bucket.absMax === null ? Math.abs(value) : Math.max(bucket.absMax, Math.abs(value));
  bucket.finiteCount += 1;
};

export const computeMatrixDataStats = (matrix: MatrixRecord): MatrixDataStats => {
  const [rows, cols] = matrix.geometry.shape;
  const allValues = emptyBucket();
  const offDiagonal = emptyBucket();

  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const value = getMatrixValue(matrix, i, j);
      addValue(allValues, value);
      if (i !== j) addValue(offDiagonal, value);
    }
  }

  return { allValues, offDiagonal };
};

export const computeArrayMatrixDataStats = (data: number[][]): MatrixDataStats => {
  const allValues = emptyBucket();
  const offDiagonal = emptyBucket();

  data.forEach((row, i) => {
    row.forEach((value, j) => {
      const normalized = Number.isFinite(value) ? value : null;
      addValue(allValues, normalized);
      if (i !== j) addValue(offDiagonal, normalized);
    });
  });

  return { allValues, offDiagonal };
};
