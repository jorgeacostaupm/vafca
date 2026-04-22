import { valuePassesRangeFilter } from "@/utils/matrixFiltering";
import type { MatrixValueRange } from "@/types/matrixView";
import type {
  FilterContributor,
  MatrixNetworkViewSettings,
  NodeLinkNetworkViewSettings,
  ViewVisibility,
} from "@/types/networkVisualization";


export const buildLinkKey = (a: string, b: string) =>
  a <= b ? `${a}::${b}` : `${b}::${a}`;

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

const combineUnion = (sets: Set<string>[]) => {
  const union = new Set<string>();
  sets.forEach((set) => {
    set.forEach((value) => union.add(value));
  });
  return union;
};

const combineIntersection = (sets: Set<string>[]) => {
  if (sets.length === 0) return null;
  const [first, ...rest] = sets;
  const intersection = new Set(first);
  rest.forEach((set) => {
    Array.from(intersection).forEach((value) => {
      if (!set.has(value)) {
        intersection.delete(value);
      }
    });
  });
  return intersection;
};

export const resolveAllowedSet = (
  contributors: FilterContributor[],
  targetViewId: string,
  kind: "nodeIds" | "linkIds",
  visibilityByViewId: Record<string, ViewVisibility>,
) => {
  const effectiveSources = contributors.filter(
    (source) =>
      source.viewId !== targetViewId && source.viewId in visibilityByViewId,
  );
  if (effectiveSources.length === 0) return null;

  const orSets = effectiveSources
    .filter((source) => source.mode === "or")
    .map((source) => visibilityByViewId[source.viewId][kind]);
  const andSets = effectiveSources
    .filter((source) => source.mode === "and")
    .map((source) => visibilityByViewId[source.viewId][kind]);

  if (orSets.length > 0 && andSets.length === 0) {
    return combineUnion(orSets);
  }
  if (andSets.length > 0 && orSets.length === 0) {
    return combineIntersection(andSets);
  }

  const orUnion = combineUnion(orSets);
  const andIntersection = combineIntersection(andSets);
  if (!andIntersection) return orUnion;

  Array.from(orUnion).forEach((value) => {
    if (!andIntersection.has(value)) {
      orUnion.delete(value);
    }
  });
  return orUnion;
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
    nodeFilterMode: source.nodeFilterMode,
    useAsLinkFilter: source.useAsLinkFilter,
    linkFilterMode: source.linkFilterMode,
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
