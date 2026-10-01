import type {
  AggregatedNodeSet,
  AggregationDerivation,
  MatrixCellValue,
  Network,
  NodeGroup,
  NodeSet,
} from "@/types/network";
import { buildCircularCategoryOrderKey } from "@/utils/circular/hierarchy";
import { getNetworkValue } from "@/utils/networkData";
import { computeNetworkMatrixDataStats } from "@/utils/networkDataStats";

export type NodeGroupingConfig = {
  source: "visualizationSettings" | "manual";
  fields: string[];
  categoryOrder: Record<string, string[]>;
  paletteId?: string | null;
  missingTagPolicy: "unknown_group" | "exclude" | "error";
};

export type AggregatedNetworkOrderMode = "matrix" | "circular";

export type BuildNodeGroupsResult = {
  groups: NodeGroup[];
  excludedNodeIds: string[];
  missingTagNodeIds: string[];
};

export type ComputeAggregatedNetworkDataResult = {
  data: MatrixCellValue[][];
  cellCounts: number[][];
};

export type ComputeAggregatedVisibleNetworkDataResult =
  ComputeAggregatedNetworkDataResult & {
    labels: string[];
    groups: NodeGroup[];
  };

export type CreateAggregatedNetworkArgs = {
  baseNetwork: Network;
  nodeSet: NodeSet;
  groups: NodeGroup[];
  data: MatrixCellValue[][];
  cellCounts: number[][];
  fields: string[];
  excludedNodeIds: string[];
  activeNodeIds: string[];
  activeNodeSetHash: string;
  groupOrderHash: string;
  orderMode: AggregatedNetworkOrderMode;
  missingTagPolicy: NodeGroupingConfig["missingTagPolicy"];
};

const UNKNOWN_VALUE = "Unknown";

const tagToString = (value: unknown) => {
  if (!["string", "number", "boolean"].includes(typeof value) || value === "") return null;
  return String(value);
};

const groupIdFromCriteria = (
  fields: string[],
  criteria: Record<string, string>,
) => fields.map((field) => `${field}=${criteria[field]}`).join("|");

const groupLabelFromCriteria = (
  fields: string[],
  criteria: Record<string, string>,
) => fields.map((field) => criteria[field]).join(" / ");

export const getCurrentVisualizationGrouping = (
  fields: string[],
  categoryOrder: Record<string, string[]> = {},
): NodeGroupingConfig | null => {
  const normalized = fields.map((field) => field.trim()).filter(Boolean);
  if (normalized.length === 0) return null;
  return {
    source: "visualizationSettings",
    fields: Array.from(new Set(normalized)),
    categoryOrder,
    paletteId: "current",
    missingTagPolicy: "unknown_group",
  };
};

export const hashNodeSet = (nodeIds: string[]) => {
  const source = [...nodeIds].sort().join("|");
  return hashString(source);
};

export const hashGroupOrder = (groupIds: string[]) =>
  hashString(groupIds.join("|"));

const hashString = (source: string) => {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

export const buildNodeGroupsFromMetadata = ({
  nodeSet,
  fields,
  categoryOrder = {},
  activeNodeIds,
  missingTagPolicy,
}: {
  nodeSet: NodeSet;
  fields: string[];
  categoryOrder?: Record<string, string[]>;
  activeNodeIds: Set<string>;
  missingTagPolicy: NodeGroupingConfig["missingTagPolicy"];
}): BuildNodeGroupsResult => {
  const groups = new Map<string, NodeGroup>();
  const excludedNodeIds: string[] = [];
  const missingTagNodeIds: string[] = [];

  nodeSet.nodes.forEach((node) => {
    const nodeId = String(node.id);
    if (!activeNodeIds.has(nodeId)) {
      excludedNodeIds.push(nodeId);
      return;
    }

    const criteria: Record<string, string> = {};
    const missing = fields.filter(
      (field) => tagToString(node.metadata?.[field]) === null,
    );
    if (missing.length > 0) {
      missingTagNodeIds.push(nodeId);
      if (missingTagPolicy === "exclude") {
        excludedNodeIds.push(nodeId);
        return;
      }
      if (missingTagPolicy === "error") return;
    }

    fields.forEach((field) => {
      criteria[field] = tagToString(node.metadata?.[field]) ?? UNKNOWN_VALUE;
    });

    const id = groupIdFromCriteria(fields, criteria);
    const existing = groups.get(id);
    if (existing) {
      existing.nodeIds.push(nodeId);
      return;
    }
    groups.set(id, {
      id,
      label: groupLabelFromCriteria(fields, criteria),
      criteria,
      nodeIds: [nodeId],
    });
  });

  const compareGroups = (a: NodeGroup, b: NodeGroup) => {
    const parentValues: string[] = [];

    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index];
      const orderKey = buildCircularCategoryOrderKey(index, parentValues);
      const configuredOrder = categoryOrder[orderKey] ?? [];
      const aValue = a.criteria[field] ?? UNKNOWN_VALUE;
      const bValue = b.criteria[field] ?? UNKNOWN_VALUE;
      const aIndex = configuredOrder.indexOf(aValue);
      const bIndex = configuredOrder.indexOf(bValue);

      if (aIndex !== bIndex) {
        if (aIndex < 0) return 1;
        if (bIndex < 0) return -1;
        return aIndex - bIndex;
      }

      const fallback = aValue.localeCompare(bValue, undefined, {
        sensitivity: "base",
      });
      if (fallback !== 0) return fallback;
      parentValues.push(aValue);
    }

    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  };

  return {
    groups: Array.from(groups.values()).sort(compareGroups),
    excludedNodeIds,
    missingTagNodeIds,
  };
};

const isValidValue = (value: number | null): value is number =>
  typeof value === "number" && Number.isFinite(value);

const meanOrNull = (values: number[]) => {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const computeAggregatedNetworkData = ({
  baseNetwork,
  groups,
}: {
  baseNetwork: Network;
  nodeSet: NodeSet;
  groups: NodeGroup[];
}): ComputeAggregatedNetworkDataResult => {
  const data = groups.map((sourceGroup, sourceIndex) =>
    groups.map((targetGroup, targetIndex) => {
      const values: number[] = [];

      sourceGroup.nodeIds.forEach((sourceNodeId, localSourceIndex) => {
        targetGroup.nodeIds.forEach((targetNodeId, localTargetIndex) => {
          if (sourceIndex === targetIndex) {
            if (sourceNodeId === targetNodeId) return;
            if (localTargetIndex <= localSourceIndex) return;
          }
          const value = getNetworkValue(baseNetwork, sourceNodeId, targetNodeId);
          if (isValidValue(value)) values.push(value);
        });
      });

      return meanOrNull(values);
    }),
  );

  const cellCounts = groups.map((sourceGroup, sourceIndex) =>
    groups.map((targetGroup, targetIndex) => {
      const sourceSize = sourceGroup.nodeIds.length;
      const targetSize = targetGroup.nodeIds.length;
      if (sourceIndex !== targetIndex) return sourceSize * targetSize;
      return (sourceSize * Math.max(sourceSize - 1, 0)) / 2;
    }),
  );

  for (let row = 0; row < data.length; row += 1) {
    for (let col = row + 1; col < data.length; col += 1) {
      data[col][row] = data[row][col];
      cellCounts[col][row] = cellCounts[row][col];
    }
  }

  return { data, cellCounts };
};

const labelsMatch = (left: string[], right: string[]) =>
  left.length === right.length && left.every((label, index) => label === right[index]);

export const computeAggregatedVisibleNetworkData = ({
  data,
  rowLabels,
  colLabels,
  groups,
  symmetric,
}: {
  data: MatrixCellValue[][];
  rowLabels: string[];
  colLabels: string[];
  groups: NodeGroup[];
  symmetric: boolean;
}): ComputeAggregatedVisibleNetworkDataResult => {
  const rowIndexById = new Map(rowLabels.map((id, index) => [id, index] as const));
  const colIndexById = new Map(colLabels.map((id, index) => [id, index] as const));
  const visibleGroups = groups.filter((group) =>
    group.nodeIds.some((id) => rowIndexById.has(id) || colIndexById.has(id)),
  );
  const squareVisibleMatrix = labelsMatch(rowLabels, colLabels);

  const cellCounts = Array.from({ length: visibleGroups.length }, () =>
    Array<number>(visibleGroups.length).fill(0),
  );
  const aggregatedData = visibleGroups.map((sourceGroup, sourceIndex) =>
    visibleGroups.map((targetGroup, targetIndex) => {
      const values: number[] = [];

      sourceGroup.nodeIds.forEach((sourceNodeId) => {
        const rowIndex = rowIndexById.get(sourceNodeId);
        if (rowIndex === undefined) return;

        targetGroup.nodeIds.forEach((targetNodeId) => {
          if (sourceIndex === targetIndex && sourceNodeId === targetNodeId) return;
          const colIndex = colIndexById.get(targetNodeId);
          if (colIndex === undefined) return;
          const value = data[rowIndex]?.[colIndex] ?? null;
          if (isValidValue(value)) values.push(value);
        });
      });

      cellCounts[sourceIndex][targetIndex] = values.length;
      return meanOrNull(values);
    }),
  );

  if (symmetric && squareVisibleMatrix) {
    for (let row = 0; row < aggregatedData.length; row += 1) {
      for (let col = row + 1; col < aggregatedData.length; col += 1) {
        aggregatedData[col][row] = aggregatedData[row][col];
        cellCounts[col][row] = cellCounts[row][col];
      }
    }
  }

  return {
    data: aggregatedData,
    cellCounts,
    labels: visibleGroups.map((group) => group.id),
    groups: visibleGroups,
  };
};

export const buildAggregatedNetworkId = (
  baseNetworkId: string,
  fields: string[],
  aggregator = "mean",
  groupOrderHash?: string,
) =>
  [
    `agg__${baseNetworkId}__by__${fields.join("_")}__${aggregator}`,
    groupOrderHash ? `order__${groupOrderHash}` : null,
  ]
    .filter(Boolean)
    .join("__");

const createAggregatedNodeSet = ({
  baseNodeSet,
  groups,
  groupOrderHash,
}: {
  baseNodeSet: NodeSet;
  groups: NodeGroup[];
  groupOrderHash: string;
}): AggregatedNodeSet => ({
  id: `${baseNodeSet.id}__aggregation__${groupOrderHash}`,
  label: `${baseNodeSet.label} groups`,
  description: `Node groups derived from ${baseNodeSet.label}.`,
  version: baseNodeSet.version,
  coordinateSystem: baseNodeSet.coordinateSystem,
  terminology: { singular: "group", plural: "groups" },
  sourceNodeSetId: baseNodeSet.id,
  nodes: groups.map((group, index) => ({
    id: group.id,
    label: group.label,
    index,
    metadata: group.criteria,
    sourceNodeIds: group.nodeIds,
    criteria: group.criteria,
  })),
});

export const createAggregatedNetwork = ({
  baseNetwork,
  nodeSet,
  groups,
  data,
  cellCounts,
  fields,
  excludedNodeIds,
  activeNodeIds,
  activeNodeSetHash,
  groupOrderHash,
  orderMode,
  missingTagPolicy,
}: CreateAggregatedNetworkArgs): Network => {
  const id = buildAggregatedNetworkId(baseNetwork.id, fields, "mean", groupOrderHash);
  const label = `${baseNetwork.label ?? baseNetwork.id} by ${fields.join(" / ")}`;
  const aggregatedNodeSet = createAggregatedNodeSet({
    baseNodeSet: nodeSet,
    groups,
    groupOrderHash,
  });

  const derivation: AggregationDerivation = {
    type: "aggregation",
    source: "visualizationSettings",
    baseNetworkId: baseNetwork.id,
    sourceNodeSetId: nodeSet.id,
    fields,
    aggregator: "mean",
    formula: "mean of all valid node-to-node edges connecting active node groups",
    parameters: {
      baseNetworkId: baseNetwork.id,
      fields,
      aggregator: "mean",
      ignoreMissing: true,
      includeInactiveNodes: false,
      missingNodePolicy: missingTagPolicy,
      groupOrderHash,
      orderMode,
      withinGroupMode: "upperTriangleNoDiagonal",
      betweenGroupMode: "allPairs",
      activeNodeSetHash,
    },
    groups,
    cellCounts,
    missingNodePolicy: missingTagPolicy,
    excludedNodeIds,
    activeNodeSetHash,
    groupOrderHash,
  };

  return {
    ...baseNetwork,
    id,
    label,
    dimensions: { ...baseNetwork.dimensions },
    statisticId: "mean",
    nodeSetId: aggregatedNodeSet.id,
    nodeIds: aggregatedNodeSet.nodes.map((node) => node.id),
    data: {
      format: "matrix",
      layout: "full",
      dtype:
        baseNetwork.data.format === "matrix" ? baseNetwork.data.dtype : "float64",
      missingValue: null,
      values: data,
    },
    dataStats: computeNetworkMatrixDataStats(data),
    provenance: {
      generatedBy: "frontend",
      createdAt: new Date().toISOString(),
      software: "connectivity-viewer",
      version: null,
      dependencies: [baseNetwork.id],
      parameters: {
        operator: "node_group_aggregate",
        fields,
        aggregator: "mean",
        source: "visualizationSettings",
        dimensions: baseNetwork.dimensions,
        activeNodeIds,
        groupOrderHash,
        orderMode,
      },
    },
    derivation,
  };
};

export const findEquivalentAggregatedNetwork = (
  networks: Network[],
  request: {
    baseNetworkId: string;
    fields: string[];
    activeNodeSetHash: string;
    groupOrderHash: string;
    missingTagPolicy: NodeGroupingConfig["missingTagPolicy"];
    sourceNodeSetId: string;
  },
) =>
  networks.find((network) => {
    const derivation = network.derivation;
    if (derivation?.type !== "aggregation") return false;
    return (
      derivation.sourceNodeSetId === request.sourceNodeSetId &&
      derivation.baseNetworkId === request.baseNetworkId &&
      derivation.aggregator === "mean" &&
      derivation.missingNodePolicy === request.missingTagPolicy &&
      derivation.activeNodeSetHash === request.activeNodeSetHash &&
      derivation.groupOrderHash === request.groupOrderHash &&
      derivation.fields.length === request.fields.length &&
      derivation.fields.every((field, index) => field === request.fields[index])
    );
  }) ?? null;
