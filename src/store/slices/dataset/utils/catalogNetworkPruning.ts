import type { DatasetNetworkSummary } from "@/types/datasetNetworkView";
import type { UpdateCatalogPayload } from "@/types/datasetState";
import type { Network } from "@/types/network";
import { getNetworkPopulationIds } from "@/utils/networkMetadata";

export type CatalogNetworkPrunePayload = {
  catalog: UpdateCatalogPayload["catalog"];
  id: string;
  invalidCompoundIds: string[];
  invalidNetworkIds: string[];
};

export const summaryMatchesCatalogItem = (
  summary: DatasetNetworkSummary,
  catalog: UpdateCatalogPayload["catalog"],
  id: string,
) => {
  if (catalog === "populations") return summary.populationIds.includes(id);
  if (catalog === "measures") return summary.measureId === id;
  if (catalog === "statistics") return summary.statId === id;
  if (catalog === "layers") return summary.layerId === id;
  return false;
};

export const getInvalidCompoundIdsForCatalogItem = (
  summaries: DatasetNetworkSummary[],
  catalog: UpdateCatalogPayload["catalog"],
  id: string,
) =>
  summaries
    .filter((summary) => summaryMatchesCatalogItem(summary, catalog, id))
    .map((summary) => summary.compoundId);

export const networkMatchesCatalogItem = (
  network: Network,
  catalog: UpdateCatalogPayload["catalog"],
  id: string,
) => {
  if (catalog === "populations") return getNetworkPopulationIds(network).includes(id);
  if (catalog === "measures") return network.measureId === id;
  if (catalog === "statistics") return network.statisticId === id;
  if (catalog === "layers") return (network.context.layerId ?? "none") === id;
  return false;
};

export const getInvalidNetworkIdsForCatalogItem = (
  networks: Network[],
  catalog: UpdateCatalogPayload["catalog"],
  id: string,
) =>
  networks
    .filter((network) => networkMatchesCatalogItem(network, catalog, id))
    .map((network) => network.id);
