import type { NetworkDataset } from "@/types/network";

const isComparisonSource = (sourceId: string, dataset: NetworkDataset) =>
  dataset.catalogs.sources[sourceId]?.kind === "comparison";

export const areRankingSourcesCompatible = (
  sourceIds: string[],
  dataset: NetworkDataset,
) =>
  sourceIds.length < 2 ||
  sourceIds.every(
    (sourceId) =>
      isComparisonSource(sourceId, dataset) ===
      isComparisonSource(sourceIds[0], dataset),
  );
