import type {
  DatasetNetworkSummary,
  MaterializedNetworkView,
} from "@/types/datasetNetworkView";
import type { DatasetMeta, NetworkStats } from "@/types/datasetState";
import type { Network } from "@/types/network";
import type { NodeOrderEntry } from "@/types/nodeOrder";
import { materializeNetworkMatrix } from "@/utils/networkData";
import { createNetworkCompoundId } from "@/utils/networkMetadata";
import { buildNetworkStats } from "@/utils/networkStats";

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
      metadata: node.metadata,
    }));

export const getDatasetAtlasId = (dataset: DatasetMeta | null | undefined) =>
  dataset?.content.nodeSet.id;

export const getDatasetAtlasLabel = (dataset: DatasetMeta | null | undefined) =>
  dataset?.content.nodeSet.label ?? "Unknown";

export const getDatasetNetworkStats = (
  dataset: DatasetMeta | null | undefined,
): NetworkStats =>
  buildNetworkStats((dataset?.content.networks ?? []).map(toDatasetNetworkSummary));

export const toDatasetNetworkSummary = (network: Network): DatasetNetworkSummary => ({
  ...(network.derivation?.type === 'comparison' && network.derivation.inputs
    ? { comparisonInputs: network.derivation.inputs } : {}),
  compoundId: createNetworkCompoundId(network),
  sourceId: network.sourceId,
  measureId: network.measureId,
  statisticId: network.statisticId,
  dimensions: network.dimensions,
  size: network.nodeIds.length,
  symmetric: true,
});

export const toMaterializedNetworkView = (network: Network): MaterializedNetworkView => {
  const networkViewData = {
    id: network.id,
    sourceId: network.sourceId,
    measureId: network.measureId,
    statisticId: network.statisticId,
    dimensions: network.dimensions,
    nodeIds: network.nodeIds,
    data: materializeNetworkMatrix(network),
    symmetric: true,
    dataStats: network.dataStats,
  };
  return {
    ...networkViewData,
    compoundId: createNetworkCompoundId(network),
  };
};

export const getMaterializedNetworkByCompoundId = (
  dataset: DatasetMeta | null | undefined,
  compoundId: string,
): MaterializedNetworkView | undefined => {
  const network = dataset?.content.networks.find(
    (network) => createNetworkCompoundId(network) === compoundId,
  );
  return network ? toMaterializedNetworkView(network) : undefined;
};
