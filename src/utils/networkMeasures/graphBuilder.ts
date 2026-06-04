import type {
  ConnectivityDataState,
  ConnectivityMatrix,
} from "@/types/connectivityBundle";
import type { NetworkSummaryComputeOptions } from "@/types/networkMeasures";
import { getMatrixValue } from "@/utils/connectivityMatrix";
import { resolveMatrixEndpointIds } from "@/utils/rankings/rankingMatrixMetadata";

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
  matrix: ConnectivityMatrix;
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

const isScalarTagValue = (
  value: unknown,
): value is string | number | boolean | null =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean" ||
  value === null;

const getRoiTags = (
  connectivity: ConnectivityDataState,
  id: string,
): Record<string, string | number | boolean | null> => {
  const roi =
    connectivity.atlas.rois.find((item) => item.id === id) ??
    connectivity.atlas.rois.find((item) => String(item.atlasId) === id);
  if (!roi) return {};

  return Object.fromEntries(
    Object.entries(roi.tags).filter((entry): entry is [
      string,
      string | number | boolean | null,
    ] => isScalarTagValue(entry[1])),
  );
};

const getEndpointTags = (
  matrix: ConnectivityMatrix,
  connectivity: ConnectivityDataState,
  id: string,
) =>
  matrix.aggregation?.groups.find((group) => group.id === id)?.criteria ??
  getRoiTags(connectivity, id);

const getEndpointLabel = (
  matrix: ConnectivityMatrix,
  connectivity: ConnectivityDataState,
  id: string,
) =>
  matrix.aggregation?.groups.find((group) => group.id === id)?.label ??
  connectivity.atlas.rois.find((roi) => roi.id === id)?.label ??
  connectivity.atlas.rois.find((roi) => String(roi.atlasId) === id)?.label ??
  id;

const createEdgeId = (sourceId: string, targetId: string, directed: boolean) =>
  directed
    ? `${sourceId}::${targetId}`
    : [sourceId, targetId].sort().join("::");

export const buildNetworkMeasureGraph = ({
  connectivity,
  matrix,
  options,
}: {
  connectivity: ConnectivityDataState;
  matrix: ConnectivityMatrix;
  options: NetworkSummaryComputeOptions;
}): NetworkMeasureGraph => {
  const [rows, cols] = matrix.geometry.shape;
  const endpointIds = resolveMatrixEndpointIds(matrix, connectivity);
  const nodeCount = Math.max(rows, endpointIds.length);
  const directed = !matrix.encoding.symmetric;
  const nodes = Array.from({ length: nodeCount }, (_, index) => {
    const id = endpointIds[index] ?? String(index);
    return {
      id,
      label: getEndpointLabel(matrix, connectivity, id),
      tags: getEndpointTags(matrix, connectivity, id),
    };
  });

  const edges: NetworkMeasureEdge[] = [];
  const adjacency = Array.from({ length: nodeCount }, () => new Set<number>());
  let evaluatedEdgeCount = 0;
  let invalidEdgeCount = 0;
  let zeroEdgeCount = 0;
  let positiveEdgeCount = 0;
  let negativeEdgeCount = 0;

  for (let i = 0; i < rows; i += 1) {
    const start = directed ? 0 : i;
    for (let j = start; j < cols; j += 1) {
      if (!options.includeDiagonal && i === j) continue;
      evaluatedEdgeCount += 1;

      const value = getMatrixValue(matrix, i, j);
      if (value === null || !Number.isFinite(value)) {
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
    matrix,
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
