import type { DatasetNetworkSummary } from "@/types/datasetNetworkView";
import type { NetworkSelectorControlsState } from "@/types/networkVisualization";

type NetworkFilters = Pick<NetworkSelectorControlsState,
  "sourceId" | "measureId" | "statisticId" | "aspectFilters"
>;

export const reconcileNetworkFilters = (
  filters: NetworkFilters,
  summaries: DatasetNetworkSummary[],
  aspectIds: string[],
): NetworkFilters => {
  const next = { ...filters, aspectFilters: { ...filters.aspectFilters } };
  let candidates = summaries;
  let hasParent = true;
  for (const key of ["sourceId", "measureId", "statisticId"] as const) {
    const matching = candidates.filter((summary) => summary[key] === next[key]);
    if (!hasParent || !next[key] || matching.length === 0) {
      next[key] = "";
      hasParent = false;
    } else {
      candidates = matching;
    }
  }
  if (!hasParent) return { ...next, aspectFilters: {} };

  for (const id of aspectIds) {
    const value = next.aspectFilters[id];
    if (!value) continue;
    const matching = candidates.filter((summary) => summary.dimensions[id] === value);
    if (matching.length === 0) delete next.aspectFilters[id];
    else candidates = matching;
  }
  return next;
};
