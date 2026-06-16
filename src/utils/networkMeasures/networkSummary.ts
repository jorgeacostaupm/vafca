import type { Network, NetworkDataset, NodeSet } from "@/types/network";
import type {
  NetworkLinkSummary,
  NetworkNodeSummary,
  NetworkSummaryComputeOptions,
  NetworkSummaryCoverage,
  NetworkSummaryResult,
} from "@/types/networkMeasures";
import { isDirectedNetwork } from "@/utils/networkData";
import {
  buildGlobalMeasures,
  buildNodeSummaries,
} from "@/utils/networkMeasures/globalMeasures";
import {
  buildNetworkMeasureGraph,
  type NetworkMeasureGraph,
} from "@/utils/networkMeasures/graphBuilder";
import { buildGroupSummaries } from "@/utils/networkMeasures/groupMeasures";
import { buildWeightDistribution } from "@/utils/networkMeasures/statistics";
import {
  createNetworkCompoundId,
  formatNetworkDataSize,
  formatNetworkLabel,
  formatNetworkSourceLabel,
  getNetworkSourceType,
} from "@/utils/networkMetadata";

const divide = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : null;

const getCoverage = (graph: NetworkMeasureGraph): NetworkSummaryCoverage => {
  const finiteEdgeCount = graph.evaluatedEdgeCount - graph.invalidEdgeCount;
  const usedEdgeCount = graph.edges.length;
  const density = divide(usedEdgeCount, graph.possibleEdgeCount);

  return {
    nodeCount: graph.nodes.length,
    possibleEdgeCount: graph.possibleEdgeCount,
    evaluatedEdgeCount: graph.evaluatedEdgeCount,
    usedEdgeCount,
    invalidEdgeCount: graph.invalidEdgeCount,
    zeroEdgeCount: graph.zeroEdgeCount,
    positiveEdgeCount: graph.positiveEdgeCount,
    negativeEdgeCount: graph.negativeEdgeCount,
    density,
    sparsity: density === null ? null : 1 - density,
    positiveEdgePercent: divide(graph.positiveEdgeCount, finiteEdgeCount),
    negativeEdgePercent: divide(graph.negativeEdgeCount, finiteEdgeCount),
    zeroEdgePercent: divide(graph.zeroEdgeCount, finiteEdgeCount),
  };
};

const getNodeGroupLabel = (
  graph: NetworkMeasureGraph,
  nodeIndex: number,
  groupingFields: string[],
) => {
  if (groupingFields.length === 0) return undefined;
  return groupingFields
    .map((field) => String(graph.nodes[nodeIndex]?.tags[field] ?? "Unknown"))
    .join(" / ");
};

const withGroupLabels = (
  graph: NetworkMeasureGraph,
  nodes: NetworkNodeSummary[],
  groupingFields: string[],
) =>
  nodes.map((node, index) => ({
    ...node,
    groupLabel: getNodeGroupLabel(graph, index, groupingFields),
  }));

const toLinkSummary = (
  graph: NetworkMeasureGraph,
  edge: NetworkMeasureGraph["edges"][number],
  groupingFields: string[],
): NetworkLinkSummary => ({
  id: edge.id,
  sourceId: edge.sourceId,
  targetId: edge.targetId,
  sourceLabel: graph.nodes[edge.sourceIndex]?.label ?? edge.sourceId,
  targetLabel: graph.nodes[edge.targetIndex]?.label ?? edge.targetId,
  sourceGroupLabel: getNodeGroupLabel(graph, edge.sourceIndex, groupingFields),
  targetGroupLabel: getNodeGroupLabel(graph, edge.targetIndex, groupingFields),
  value: edge.value,
});

const getTopLinks = (
  graph: NetworkMeasureGraph,
  groupingFields: string[],
  topItemsLimit: number,
) => {
  const byAbsolute = [...graph.edges]
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
    .slice(0, topItemsLimit)
    .map((edge) => toLinkSummary(graph, edge, groupingFields));
  const positive = graph.edges
    .filter((edge) => edge.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, topItemsLimit)
    .map((edge) => toLinkSummary(graph, edge, groupingFields));
  const negative = graph.edges
    .filter((edge) => edge.value < 0)
    .sort((left, right) => left.value - right.value)
    .slice(0, topItemsLimit)
    .map((edge) => toLinkSummary(graph, edge, groupingFields));

  return { byAbsolute, positive, negative };
};

export const buildNetworkSummary = ({
  dataset,
  network,
  nodeSet,
  activeGroupingFields,
  options,
}: {
  dataset: NetworkDataset;
  network: Network;
  nodeSet: NodeSet;
  activeGroupingFields: string[];
  options: NetworkSummaryComputeOptions;
}): NetworkSummaryResult => {
  const graph = buildNetworkMeasureGraph({ network, nodeSet, options });
  const coverage = getCoverage(graph);
  const weightValues = graph.edges.map((edge) => edge.value);
  const { grouping, groups } = buildGroupSummaries({
    graph,
    activeGroupingFields,
    includeDiagonal: options.includeDiagonal,
  });
  const nodeSummaries = withGroupLabels(
    graph,
    buildNodeSummaries(graph),
    grouping.fields,
  );
  const global = buildGlobalMeasures(graph, nodeSummaries);
  const links = getTopLinks(graph, grouping.fields, options.topItemsLimit);
  const layerId = network.context.layerId ?? "none";
  const directed = isDirectedNetwork(network);
  const networkKind = "sourceNodeSetId" in nodeSet ? "aggregated" : "node";

  return {
    identity: {
      networkId: network.id,
      compoundId: createNetworkCompoundId(network),
      label: formatNetworkLabel(network, dataset),
      kind: getNetworkSourceType(network),
      measureLabel:
        dataset.catalogs.measures[network.measureId]?.label ??
        network.measureId,
      statisticLabel:
        dataset.catalogs.statistics[network.statisticId]?.label ??
        network.statisticId,
      layerLabel: dataset.catalogs.layers[layerId]?.label ?? layerId,
      populationLabel: formatNetworkSourceLabel(network, dataset),
      dataSize: formatNetworkDataSize(network),
      nodeCount: graph.nodes.length,
      symmetric: !directed,
      directed,
      networkKind,
      scope: "complete",
    },
    coverage,
    weights: buildWeightDistribution(weightValues),
    global,
    nodes: nodeSummaries,
    topNodesByDegree: [...nodeSummaries]
      .sort((left, right) => right.degree - left.degree)
      .slice(0, options.topItemsLimit),
    isolatedNodes: nodeSummaries.filter((node) => node.isolated),
    topLinksByAbsoluteValue: links.byAbsolute,
    topPositiveLinks: links.positive,
    topNegativeLinks: links.negative,
    groups,
    grouping,
    createdAt: new Date().toISOString(),
  };
};
