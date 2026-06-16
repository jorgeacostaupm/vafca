import type { StatRangeValue } from "@/types/matrixView";
import type { Catalogs } from "@/types/network";

type PopulationCatalogsLike = {
  populations?: Record<string, { label?: string } | undefined>;
};

type NetworkSummaryLike = {
  populationIds: string[];
  measureId: string;
  statId: string;
  layerId: string;
};

export const toLabel = (value?: string) => value ?? "Unknown";

export const normalizePopulationKey = (ids: string[]) =>
  [...ids].sort().join("+");

export const formatPopulationLabel = (
  id: string,
  catalogs?: PopulationCatalogsLike,
) => catalogs?.populations?.[id]?.label ?? id;

export const formatPopulationSetLabel = (
  ids: string[],
  catalogs?: PopulationCatalogsLike,
) => ids.map((id) => formatPopulationLabel(id, catalogs)).join(" vs ");

export const isEnabled = (value: { enabled?: boolean } | undefined) =>
  value?.enabled !== false;

export const hasOnlyEnabledPopulations = (
  ids: string[],
  populations: Record<string, { enabled?: boolean }> | undefined,
) => ids.every((id) => isEnabled(populations?.[id]));

export const areLabelListsEqual = (
  a: string[] | null | undefined,
  b: string[] | null | undefined,
) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export const areZoomSelectionsEqual = (
  a: { rows: string[]; cols: string[]; linkIds?: string[] } | null | undefined,
  b: { rows: string[]; cols: string[]; linkIds?: string[] } | null | undefined,
) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    areLabelListsEqual(a.rows, b.rows) &&
    areLabelListsEqual(a.cols, b.cols) &&
    areLabelListsEqual(a.linkIds, b.linkIds)
  );
};

export const intersectLabels = (
  labels: string[],
  base: string[] | undefined,
  zoom: string[] | null | undefined,
) => {
  let selected = labels;
  if (base) {
    const baseSet = new Set(base);
    selected = selected.filter((label) => baseSet.has(label));
  }
  if (zoom) {
    const zoomSet = new Set(zoom);
    selected = selected.filter((label) => zoomSet.has(label));
  }
  return selected;
};

export const buildDefaultRanges = (
  items: Record<string, { min?: number; max?: number }> | undefined,
) => {
  if (!items) return {} as Record<string, [number, number]>;
  return Object.entries(items).reduce<Record<string, [number, number]>>(
    (acc, [id, item]) => {
      if (Number.isFinite(item.min) && Number.isFinite(item.max)) {
        const min = item.min as number;
        const max = item.max as number;
        acc[id] = min <= max ? [min, max] : [max, min];
      }
      return acc;
    },
    {},
  );
};

export const buildDefaultStatRanges = (
  stats: Catalogs["statistics"] | undefined,
) => {
  if (!stats) return {} as Record<string, StatRangeValue>;
  return Object.entries(stats).reduce<Record<string, StatRangeValue>>(
    (acc, [id, stat]) => {
      if (Number.isFinite(stat.min) && Number.isFinite(stat.max)) {
        const min = stat.min as number;
        const max = stat.max as number;
        if (min < 0 && max > 0) {
          acc[id] = {
            negative: [min, 0],
            positive: [0, max],
          };
        } else {
          acc[id] = min <= max ? [min, max] : [max, min];
        }
      }
      return acc;
    },
    {},
  );
};

export const getMatrixRange = (data: number[][]) => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const row of data) {
    for (const value of row) {
      if (!Number.isFinite(value)) continue;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: undefined, max: undefined };
  }
  return { min, max };
};

export const getLegendRange = (
  data: number[][],
  measureId: string,
  statId: string,
  catalogs?: Catalogs,
) => {
  if (!catalogs) return { min: undefined, max: undefined };
  const statRange = catalogs.statistics[statId];
  const measureRange = catalogs.measures[measureId];
  const hasStatRange =
    Number.isFinite(statRange?.min) && Number.isFinite(statRange?.max);
  const hasMeasureRange =
    Number.isFinite(measureRange?.min) && Number.isFinite(measureRange?.max);
  const dataRange = getMatrixRange(data);
  const useDataRange = statRange?.useDataRange === true;

  return {
    min: useDataRange
      ? dataRange.min
      : hasStatRange
        ? statRange?.min
        : hasMeasureRange
          ? measureRange?.min
          : undefined,
    max: useDataRange
      ? dataRange.max
      : hasStatRange
        ? statRange?.max
        : hasMeasureRange
          ? measureRange?.max
          : undefined,
  };
};

export const buildNetworkSummaryLabel = (
  summary: NetworkSummaryLike,
  catalogs?: Catalogs,
) => {
  const populationLabel = formatPopulationSetLabel(
    summary.populationIds,
    catalogs,
  );
  const measureLabel = toLabel(catalogs?.measures[summary.measureId]?.label);
  const statLabel = toLabel(catalogs?.statistics[summary.statId]?.label);
  const layerLabel = toLabel(catalogs?.layers[summary.layerId]?.label);
  return `${populationLabel} · ${measureLabel} · ${statLabel} · ${layerLabel}`;
};
