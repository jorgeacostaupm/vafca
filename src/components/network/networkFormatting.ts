import { valuePassesRangeFilter } from "@/utils/matrixFiltering";
import type { MatrixValueRange } from "@/types/matrixView";
import type {
  FilterContributor,
  MatrixNetworkViewSettings,
  NodeLinkNetworkViewSettings,
  ViewVisibility,
} from "@/types/networkVisualization";
import type { RuntimeEdgeMask } from "@/types/edgeFilter";


export const buildLinkKey = (a: string, b: string) =>
  a <= b ? `${a}::${b}` : `${b}::${a}`;

export const buildRuntimeMaskLinkSet = (
  mask: RuntimeEdgeMask | null,
  labelIds: string[],
) => {
  if (!mask) return null;
  const allowed = new Set<string>();
  mask.values.forEach((row, rowIndex) => {
    row.forEach((selected, colIndex) => {
      if (!selected) return;
      const rowId = labelIds[rowIndex];
      const colId = labelIds[colIndex];
      if (!rowId || !colId || rowId === colId) return;
      allowed.add(buildLinkKey(rowId, colId));
    });
  });
  return allowed;
};

export const collectVisibleGraph = ({
  data,
  rowLabels,
  colLabels,
  includeIsolatedNodes,
  valueFilters,
}: {
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  includeIsolatedNodes: boolean;
  valueFilters?: {
    measure?: [number, number] | null;
    stat?: MatrixValueRange;
  };
}): ViewVisibility => {
  const linkIds = new Set<string>();
  const connectedNodeIds = new Set<string>();
  const measureRange = valueFilters?.measure ?? null;
  const statRange = valueFilters?.stat ?? null;

  for (let row = 0; row < rowLabels.length; row += 1) {
    for (let col = 0; col < colLabels.length; col += 1) {
      const rowId = rowLabels[row];
      const colId = colLabels[col];
      if (rowId === colId) continue;
      const value = data[row]?.[col];
      if (!Number.isFinite(value)) continue;
      if (!valuePassesRangeFilter(value, measureRange)) continue;
      if (!valuePassesRangeFilter(value, statRange)) continue;
      if (!value) continue;
      linkIds.add(buildLinkKey(rowId, colId));
      connectedNodeIds.add(rowId);
      connectedNodeIds.add(colId);
    }
  }

  const nodeIds = includeIsolatedNodes
    ? new Set([...rowLabels, ...colLabels])
    : connectedNodeIds;

  return { nodeIds, linkIds };
};

export const applyNodeMask = ({
  data,
  rowLabels,
  colLabels,
  allowedNodeIds,
}: {
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  allowedNodeIds: Set<string>;
}) => {
  const rowIndices = rowLabels
    .map((label, index) => ({ label, index }))
    .filter((entry) => allowedNodeIds.has(entry.label));
  const colIndices = colLabels
    .map((label, index) => ({ label, index }))
    .filter((entry) => allowedNodeIds.has(entry.label));

  if (rowIndices.length === 0 || colIndices.length === 0) {
    return {
      data: [] as number[][],
      rowLabels: [] as string[],
      colLabels: [] as string[],
    };
  }

  return {
    data: rowIndices.map((row) =>
      colIndices.map((col) => data[row.index]?.[col.index] ?? Number.NaN),
    ),
    rowLabels: rowIndices.map((entry) => entry.label),
    colLabels: colIndices.map((entry) => entry.label),
  };
};

export const applyLinkMask = ({
  data,
  rowLabels,
  colLabels,
  allowedLinkIds,
}: {
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  allowedLinkIds: Set<string>;
}) =>
  data.map((row, rowIndex) =>
    row.map((value, colIndex) => {
      const rowId = rowLabels[rowIndex];
      const colId = colLabels[colIndex];
      if (!rowId || !colId) return Number.NaN;
      if (rowId === colId) return value;
      return allowedLinkIds.has(buildLinkKey(rowId, colId)) ? value : Number.NaN;
    }),
  );

export const resolveAllowedSet = (
  contributors: FilterContributor[],
  targetViewId: string,
  kind: "nodeIds" | "linkIds",
  visibilityByViewId: Record<string, ViewVisibility>,
) => {
  const source = contributors.find(
    (source) =>
      source.viewId !== targetViewId && source.viewId in visibilityByViewId,
  );
  return source ? new Set(visibilityByViewId[source.viewId][kind]) : null;
};

export const intersectAllowedSets = (
  first: Set<string> | null,
  second: Set<string> | null,
) => {
  if (!first) return second;
  if (!second) return first;
  const next = new Set<string>();
  first.forEach((value) => {
    if (second.has(value)) next.add(value);
  });
  return next;
};

export const pickSharedSettings = (
  source?: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings,
) => {
  if (!source) return {};
  return {
    labels: source.labels,
    measureRange: source.measureRange,
    statRange: source.statRange,
    brushEnabled: source.brushEnabled,
    hideIsolatedNodes: source.hideIsolatedNodes,
    zoomLabelSelection: source.zoomLabelSelection,
    zoomHistory: source.zoomHistory,
    zoomIndex: source.zoomIndex,
    useAsNodeFilter: source.useAsNodeFilter,
    useAsLinkFilter: source.useAsLinkFilter,
  };
};

export const toMatrixStatFilter = (
  statRange: MatrixNetworkViewSettings["statRange"],
): MatrixValueRange => {
  if (!statRange) return null;
  if (Array.isArray(statRange)) {
    return typeof statRange[0] === "number" && typeof statRange[1] === "number"
      ? ([statRange[0], statRange[1]] as [number, number])
      : null;
  }
  return [statRange.negative, statRange.positive] as Array<[number, number]>;
};

export const toNodeLinkStatFilter = (
  statRange: NodeLinkNetworkViewSettings["statRange"],
): MatrixValueRange => {
  if (!statRange) return null;
  if (Array.isArray(statRange)) return statRange;
  return [statRange.negative, statRange.positive] as Array<[number, number]>;
};
