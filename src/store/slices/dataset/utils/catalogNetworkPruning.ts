import type { DatasetNetworkSummary } from "@/types/datasetNetworkView";
import type { UpdateCatalogPayload } from "@/types/datasetState";
import type { Network } from "@/types/network";

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
  if (catalog === "sources") return summary.sourceId === id;
  if (catalog === "measures") return summary.measureId === id;
  if (catalog === "statistics") return summary.statisticId === id;
  if (catalog === "aspectCatalogs") {
    return Object.values(summary.dimensions).includes(id);
  }
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
  if (catalog === "sources") return network.sourceId === id;
  if (catalog === "measures") return network.measureId === id;
  if (catalog === "statistics") return network.statisticId === id;
  if (catalog === "aspectCatalogs") return Object.values(network.dimensions).includes(id);
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
