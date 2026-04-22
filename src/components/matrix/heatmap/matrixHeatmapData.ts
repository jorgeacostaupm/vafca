import { resolveMatrixValue } from "@/utils/matrixValue";
import { valuePassesRangeFilter } from "@/utils/matrixFiltering";
import type { MatrixShape } from "@/types/matrix";
import type { MatrixValueRange } from "@/types/matrixView";
import type {
  HeatmapCellDatum,
  HeatmapLegendRange,
} from "@/components/matrix/heatmap/matrixHeatmapTypes";

type HeatmapValueFilters = {
  measure?: [number, number] | null;
  stat?: MatrixValueRange;
};

export const resolveHeatmapAxisLabels = (args: {
  data: number[][];
  labels?: string[];
  rowLabels?: string[];
  colLabels?: string[];
}) => {
  const { data, labels, rowLabels, colLabels } = args;
  const rows = data.length;
  const cols = rows > 0 ? (data[0]?.length ?? 0) : 0;

  const resolvedRowLabels =
    rowLabels?.length === rows
      ? rowLabels
      : labels?.length === rows
        ? labels
        : undefined;

  const resolvedColLabels =
    colLabels?.length === cols
      ? colLabels
      : labels?.length === cols
        ? labels
        : undefined;

  return { resolvedRowLabels, resolvedColLabels };
};

export const buildNormalizedMatrix = (
  data: number[][],
  matrixShape: MatrixShape,
): number[][] => {
  const rows = data.length;
  return Array.from({ length: rows }, (_, row) => {
    const cols = data[row]?.length ?? 0;
    return Array.from({ length: cols }, (_, col) =>
      resolveMatrixValue(data, row, col, matrixShape),
    );
  });
};

export const applyHeatmapValueFilters = (
  normalized: number[][],
  valueFilters?: HeatmapValueFilters,
): number[][] => {
  if (!valueFilters?.measure && !valueFilters?.stat) return normalized;

  const measureRange = valueFilters.measure ?? null;
  const statRange = valueFilters.stat ?? null;

  return normalized.map((row) =>
    row.map((value) => {
      if (!Number.isFinite(value)) return value;
      if (!valuePassesRangeFilter(value, measureRange)) return Number.NaN;
      if (!valuePassesRangeFilter(value, statRange)) return Number.NaN;
      return value;
    }),
  );
};

export const computeHeatmapFiniteBounds = (
  matrix: number[][],
): HeatmapLegendRange => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const row of matrix) {
    for (const value of row) {
      if (!Number.isFinite(value)) continue;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  return {
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 1,
  };
};

export const resolveHeatmapLegendRange = (args: {
  legendMin?: number;
  legendMax?: number;
  minValue: number;
  maxValue: number;
}): HeatmapLegendRange => {
  const { legendMin, legendMax, minValue, maxValue } = args;

  const hasMin = Number.isFinite(legendMin);
  const hasMax = Number.isFinite(legendMax);

  let min = hasMin ? (legendMin as number) : minValue;
  let max = hasMax ? (legendMax as number) : maxValue;

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = minValue;
    max = maxValue;
  }

  if (min > max) {
    [min, max] = [max, min];
  }

  if (min === max) {
    if (minValue !== maxValue) {
      min = Math.min(minValue, maxValue);
      max = Math.max(minValue, maxValue);
    } else {
      min -= 1;
      max += 1;
    }
  }

  return { min, max };
};

export const buildHeatmapCells = (matrix: number[][]): HeatmapCellDatum[] => {
  const rows = matrix.length;
  const cols = rows > 0 ? (matrix[0]?.length ?? 0) : 0;
  const cells: HeatmapCellDatum[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      cells.push({ row, col, value: matrix[row][col] });
    }
  }

  return cells;
};
