import type { Network, NodeSet, NodeTagValue } from "@/types/network";
import type { NetworkSummaryComputeOptions } from "@/types/networkMeasures";
import {
  getNetworkNodeIds,
  isDirectedNetwork,
  materializeNetworkMatrix,
} from "@/utils/networkData";

export type NetworkMeasureNode = {
  id: string;
  label: string;
  tags: Record<string, string | number | boolean | null>;
};

export type NetworkMeasureEdge = {
  id: string;
  sourceIndex: number;
  targetIndex: number;
  sourceId: string;
  targetId: string;
  value: number;
};

export type NetworkMeasureGraph = {
  network: Network;
  directed: boolean;
  nodes: NetworkMeasureNode[];
  edges: NetworkMeasureEdge[];
  adjacency: Array<Set<number>>;
  possibleEdgeCount: number;
  evaluatedEdgeCount: number;
  invalidEdgeCount: number;
  zeroEdgeCount: number;
  positiveEdgeCount: number;
  negativeEdgeCount: number;
};

const createEdgeId = (sourceId: string, targetId: string, directed: boolean) =>
  directed
    ? `${sourceId}::${targetId}`
    : [sourceId, targetId].sort().join("::");

const buildNodeMap = (nodeSet: NodeSet) =>
  new Map(nodeSet.nodes.map((node) => [node.id, node] as const));

export const buildNetworkMeasureGraph = ({
  network,
  nodeSet,
  options,
}: {
  network: Network;
  nodeSet: NodeSet;
  options: NetworkSummaryComputeOptions;
}): NetworkMeasureGraph => {
  const matrix = materializeNetworkMatrix(network);
  const nodeIds = getNetworkNodeIds(network);
  const nodeById = buildNodeMap(nodeSet);
  const nodeCount = nodeIds.length;
  const directed = isDirectedNetwork(network);
  const nodes = nodeIds.map((id) => {
    const node = nodeById.get(id);
    return {
      id,
      label: node?.label ?? id,
      tags: node?.tags ?? ({} as Record<string, NodeTagValue>),
    };
  });

  const edges: NetworkMeasureEdge[] = [];
  const adjacency = Array.from({ length: nodeCount }, () => new Set<number>());
  let evaluatedEdgeCount = 0;
  let invalidEdgeCount = 0;
  let zeroEdgeCount = 0;
  let positiveEdgeCount = 0;
  let negativeEdgeCount = 0;

  for (let i = 0; i < nodeCount; i += 1) {
    const start = directed ? 0 : i;
    for (let j = start; j < nodeCount; j += 1) {
      if (!options.includeDiagonal && i === j) continue;
      evaluatedEdgeCount += 1;

      const value = matrix[i]?.[j] ?? NaN;
      if (!Number.isFinite(value)) {
        invalidEdgeCount += 1;
        continue;
      }

      if (value === 0) zeroEdgeCount += 1;
      if (value > 0) positiveEdgeCount += 1;
      if (value < 0) negativeEdgeCount += 1;
      if (value === 0 && !options.includeZeroEdges) continue;

      const sourceId = nodes[i]?.id ?? String(i);
      const targetId = nodes[j]?.id ?? String(j);
      edges.push({
        id: createEdgeId(sourceId, targetId, directed),
        sourceIndex: i,
        targetIndex: j,
        sourceId,
        targetId,
        value,
      });

      if (i !== j) {
        adjacency[i]?.add(j);
        adjacency[j]?.add(i);
      }
    }
  }

  return {
    network,
    directed,
    nodes,
    edges,
    adjacency,
    possibleEdgeCount: evaluatedEdgeCount,
    evaluatedEdgeCount,
    invalidEdgeCount,
    zeroEdgeCount,
    positiveEdgeCount,
    negativeEdgeCount,
  };
};
