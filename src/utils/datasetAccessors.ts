import type { DatasetMeta, NetworkStats } from "@/types/datasetState";
import type { Network } from "@/types/network";
import type {
  NetworkSummaryItem,
  StoredNetworkView,
} from "@/types/networkViewStore";
import type { NodeOrderEntry } from "@/types/nodeOrder";
import { isDirectedNetwork, materializeNetworkMatrix } from "@/utils/networkData";
import {
  createNetworkCompoundId,
  getNetworkPopulationIds,
} from "@/utils/networkMetadata";
import { buildNetworkStats } from "@/utils/networkStats";

const toNodeOrderTags = (tags: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(tags).filter(
      (entry): entry is [string, string | number | boolean | null] => {
        const value = entry[1];
        return (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          value === null
        );
      },
    ),
  );

export const getDatasetCatalogs = (dataset: DatasetMeta | null | undefined) =>
  dataset?.content.catalogs;

export const getDatasetNodeOrder = (
  dataset: DatasetMeta | null | undefined,
): NodeOrderEntry[] =>
  [...(dataset?.content.nodeSet.nodes ?? [])]
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((node) => ({
      id: String(node.id),
      label: node.name ?? node.label,
      name: node.name,
      acronym: node.label,
      tags: toNodeOrderTags(node.tags),
      metadata: node.metadata,
    }));

export const getDatasetAtlasId = (dataset: DatasetMeta | null | undefined) =>
  dataset?.content.nodeSet.id;

export const getDatasetAtlasLabel = (dataset: DatasetMeta | null | undefined) =>
  dataset?.content.nodeSet.label ?? "Unknown";

export const getDatasetNetworkStats = (
  dataset: DatasetMeta | null | undefined,
): NetworkStats =>
  buildNetworkStats(
    (dataset?.content.networks ?? []).map(toStoredNetworkView),
  );

export const toStoredNetworkView = (network: Network): StoredNetworkView => {
  const networkViewData = {
    id: network.id,
    layerId: network.context.layerId ?? "none",
    measureId: network.measureId,
    statId: network.statisticId,
    populationIds: getNetworkPopulationIds(network),
    data: materializeNetworkMatrix(network),
    symmetric: !isDirectedNetwork(network),
    dataStats: network.dataStats,
  };
  return {
    ...networkViewData,
    compoundId: createNetworkCompoundId(network),
  };
};

export const getDatasetNetworkSummaries = (
  dataset: DatasetMeta | null | undefined,
): NetworkSummaryItem[] =>
  (dataset?.content.networks ?? []).map((network) => {
    const stored = toStoredNetworkView(network);
    return {
      compoundId: stored.compoundId,
      layerId: stored.layerId,
      measureId: stored.measureId,
      statId: stored.statId,
      populationIds: stored.populationIds,
      size: stored.data.length,
      symmetric: stored.symmetric,
    };
  });

export const getDatasetNetworkByCompoundId = (
  dataset: DatasetMeta | null | undefined,
  compoundId: string,
): StoredNetworkView | undefined =>
  (dataset?.content.networks ?? [])
    .map(toStoredNetworkView)
    .find((network) => network.compoundId === compoundId);
