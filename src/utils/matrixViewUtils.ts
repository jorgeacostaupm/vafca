import type { Catalogs, ComparisonNetworkInput, NetworkDerivation } from "@/types/network";

type PopulationCatalogsLike = {
  sources?: Record<string, { label?: string } | undefined>;
};

type NetworkSummaryLike = {
  comparisonInputs?: [ComparisonNetworkInput, ComparisonNetworkInput];
  derivation?: NetworkDerivation;
  sourceId: string;
  measureId: string;
  statisticId: string;
  dimensions: Record<string, string>;
};

export const toLabel = (value?: string) => value ?? "Unknown";

export const formatSourceLabel = (
  id: string,
  catalogs?: PopulationCatalogsLike,
) => catalogs?.sources?.[id]?.label ?? id;

export const isEnabled = (value: { enabled?: boolean } | undefined) =>
  value?.enabled !== false;

export const hasEnabledSource = (
  id: string,
  sources: Record<string, { enabled?: boolean }> | undefined,
) => isEnabled(sources?.[id]);

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

export const buildNetworkSummaryLabel = (
  summary: NetworkSummaryLike,
  catalogs?: Catalogs,
): string => {
  const inputs = summary.comparisonInputs ?? (summary.derivation?.type === 'comparison' ? summary.derivation.inputs : undefined);
  if (inputs) return `Pearson contribution · ${inputs.map(input => `[${buildNetworkSummaryLabel(input, catalogs)}]`).join(' ↔ ')}`;
  const sourceLabel = formatSourceLabel(summary.sourceId, catalogs);
  const measureLabel = toLabel(catalogs?.measures[summary.measureId]?.label);
  const statLabel = toLabel(catalogs?.statistics[summary.statisticId]?.label);
  const aspectLabels = catalogs?.aspects.map((aspect) => {
    const value = summary.dimensions[aspect.id];
    if (!value) return null;
    return catalogs.aspectCatalogs[aspect.id]?.[value]?.label ?? value;
  }) ?? [];
  return [sourceLabel, measureLabel, statLabel, ...aspectLabels]
    .filter(Boolean)
    .join(" · ");
};
