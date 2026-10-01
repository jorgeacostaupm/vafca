import type { MatrixValueRange } from "@/types/matrixView";
import { resolveMatrixValue } from "@/utils/matrixValue";


export const normalizeMatrixValueRanges = (range: MatrixValueRange) => {
  if (!range || range.length === 0) return [] as Array<[number, number]>;
  return Array.isArray(range[0])
    ? (range as Array<[number, number]>)
    : ([range as [number, number]] as Array<[number, number]>);
};

export const valuePassesRangeFilter = (
  value: number,
  range: MatrixValueRange,
) => {
  const ranges = normalizeMatrixValueRanges(range);
  if (ranges.length === 0) return range == null;
  return ranges.some((item) => {
    const [min, max] = item[0] <= item[1] ? item : [item[1], item[0]];
    return value >= min && value <= max;
  });
};

export const filterMatrixByLabels = (
  data: number[][],
  labels: string[] | undefined,
  allowedRowLabels: string[] | undefined,
  allowedColLabels: string[] | undefined,
) => {
  if (!labels || (!allowedRowLabels && !allowedColLabels)) {
    return labels
      ? { data, rowLabels: labels, colLabels: labels }
      : { data };
  }
  if (
    (allowedRowLabels && allowedRowLabels.length === 0) ||
    (allowedColLabels && allowedColLabels.length === 0)
  ) {
    return { data: [], rowLabels: [], colLabels: [] };
  }

  const indexByLabel = new Map(labels.map((label, idx) => [label, idx] as const));
  const toOrderedIndices = (selectedLabels: string[]) =>
    selectedLabels
      .map((label) => {
        const idx = indexByLabel.get(label);
        return typeof idx === "number" ? { label, idx } : null;
      })
      .filter((item): item is { label: string; idx: number } => item !== null);

  const rowIndices = toOrderedIndices(allowedRowLabels ?? labels);
  const colIndices = toOrderedIndices(allowedColLabels ?? labels);

  if (rowIndices.length === 0 || colIndices.length === 0) {
    return { data: [], rowLabels: [], colLabels: [] };
  }

  const filteredRowLabels = rowIndices.map((item) => item.label);
  const filteredColLabels = colIndices.map((item) => item.label);
  const filteredData = rowIndices.map((row) =>
    colIndices.map((col) =>
      resolveMatrixValue(data, row.idx, col.idx),
    ),
  );

  return {
    data: filteredData,
    rowLabels: filteredRowLabels,
    colLabels: filteredColLabels,
  };
};

export const filterIsolatedMatrixEntries = (
  data: number[][],
  rowLabels: string[] | undefined,
  colLabels: string[] | undefined,
  valueFilters?: {
    measure?: MatrixValueRange;
    stat?: MatrixValueRange;
  },
) => {
  if (!rowLabels || !colLabels) {
    return { data, rowLabels, colLabels };
  }

  if (rowLabels.length === 0 || colLabels.length === 0) {
    return { data: [], rowLabels: [], colLabels: [] };
  }

  const activeRows = new Set<number>();
  const activeCols = new Set<number>();
  const measureRange = valueFilters?.measure ?? null;
  const statRange = valueFilters?.stat ?? null;

  for (let rowIndex = 0; rowIndex < rowLabels.length; rowIndex += 1) {
    for (let colIndex = 0; colIndex < colLabels.length; colIndex += 1) {
      const value = data[rowIndex]?.[colIndex];
      if (!Number.isFinite(value)) continue;
      if (!valuePassesRangeFilter(value, measureRange)) continue;
      if (!valuePassesRangeFilter(value, statRange)) continue;
      if (!value) continue;
      if (rowLabels[rowIndex] === colLabels[colIndex]) continue;
      activeRows.add(rowIndex);
      activeCols.add(colIndex);
    }
  }

  if (activeRows.size === rowLabels.length && activeCols.size === colLabels.length) {
    return { data, rowLabels, colLabels };
  }

  const nextRowIndices = rowLabels
    .map((_, index) => index)
    .filter((index) => activeRows.has(index));
  const nextColIndices = colLabels
    .map((_, index) => index)
    .filter((index) => activeCols.has(index));

  if (nextRowIndices.length === 0 || nextColIndices.length === 0) {
    return { data: [], rowLabels: [], colLabels: [] };
  }

  return {
    data: nextRowIndices.map((rowIndex) =>
      nextColIndices.map((colIndex) => data[rowIndex]?.[colIndex] ?? Number.NaN),
    ),
    rowLabels: nextRowIndices.map((index) => rowLabels[index]),
    colLabels: nextColIndices.map((index) => colLabels[index]),
  };
};
