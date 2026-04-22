import { buildCircularHierarchyLayout } from "@/utils/circular/hierarchy";
import { buildDegreeByLabelId, buildFilteredUndirectedLinks } from "@/components/nodelink/graphModel";
import type { AtlasDefinition } from "@/types/atlas";
import type {
  CircularLink,
  CircularNode,
  NodeLinkValueFilters,
  UndirectedLink,
} from "@/types/nodelink";

const CIRCULAR_LAYOUT_MARGIN = 32;

type BuildCircularGraphDataArgs = {
  data: number[][];
  labels?: string[];
  labelNames?: Record<string, string>;
  valueFilters?: NodeLinkValueFilters;
  hideIsolatedNodes: boolean;
  width: number;
  height: number;
  atlasDefinition: AtlasDefinition | null;
  hierarchyFields: string[];
  hierarchyCategoryOrder: Record<string, string[]>;
};

type VisibleNodeRef = {
  originalIndex: number;
  fallbackOrder: number;
  labelId: string;
};

const buildVisibleNodeRefs = ({
  totalCount,
  labels,
  hideIsolatedNodes,
  degreeById,
}: {
  totalCount: number;
  labels?: string[];
  hideIsolatedNodes: boolean;
  degreeById: Map<string, number>;
}): VisibleNodeRef[] => {
  const originalIndices = hideIsolatedNodes
    ? Array.from({ length: totalCount }, (_, index) => index).filter((index) => {
        const labelId = labels?.[index] ?? String(index);
        return degreeById.has(labelId);
      })
    : Array.from({ length: totalCount }, (_, index) => index);

  return originalIndices.map((originalIndex, fallbackOrder) => ({
    originalIndex,
    fallbackOrder,
    labelId: labels?.[originalIndex] ?? String(originalIndex),
  }));
};

const buildCircularNodes = ({
  orderedVisible,
  hierarchyByLabel,
  labels,
  labelNames,
  radius,
}: {
  orderedVisible: VisibleNodeRef[];
  hierarchyByLabel: Map<string, { angle: number; x: number; y: number }>;
  labels?: string[];
  labelNames?: Record<string, string>;
  radius: number;
}): CircularNode[] => {
  const count = orderedVisible.length;
  return orderedVisible.map((item, visibleIndex) => {
    const layout = hierarchyByLabel.get(item.labelId);
    const angle =
      layout?.angle ??
      (count > 0 ? (visibleIndex / count) * Math.PI * 2 - Math.PI / 2 : 0);
    const labelId = labels?.[item.originalIndex];
    const displayLabel = labelId ? labelNames?.[labelId] ?? labelId : String(item.originalIndex);

    return {
      id: visibleIndex,
      labelId,
      label: displayLabel,
      angle,
      x: layout?.x ?? Math.cos(angle) * radius,
      y: layout?.y ?? Math.sin(angle) * radius,
    };
  });
};

export const buildCircularGraphData = ({
  data,
  labels,
  labelNames,
  valueFilters,
  hideIsolatedNodes,
  width,
  height,
  atlasDefinition,
  hierarchyFields,
  hierarchyCategoryOrder,
}: BuildCircularGraphDataArgs) => {
  const baseLinks = buildFilteredUndirectedLinks({
    data,
    labels,
    valueFilters,
  }).map((link: UndirectedLink) => ({ ...link }));

  const degreeById = buildDegreeByLabelId(baseLinks);
  const visibleOriginalIndices = buildVisibleNodeRefs({
    totalCount: data.length,
    labels,
    hideIsolatedNodes,
    degreeById,
  });

  const radius = Math.max(0, Math.min(width, height) / 2 - CIRCULAR_LAYOUT_MARGIN);
  const hierarchyLayout = buildCircularHierarchyLayout({
    labelIds: visibleOriginalIndices.map((item) => item.labelId),
    radius,
    atlasDefinition,
    hierarchyFields,
    categoryOrder: hierarchyCategoryOrder,
  });
  const hierarchyByLabel = new Map(hierarchyLayout.map((item) => [item.labelId, item] as const));

  const orderedVisible = [...visibleOriginalIndices].sort((a, b) => {
    const orderA = hierarchyByLabel.get(a.labelId)?.order ?? a.fallbackOrder;
    const orderB = hierarchyByLabel.get(b.labelId)?.order ?? b.fallbackOrder;
    return orderA - orderB;
  });

  const indexMap = new Map<number, number>();
  orderedVisible.forEach((item, visibleIndex) => {
    indexMap.set(item.originalIndex, visibleIndex);
  });

  const nodes = buildCircularNodes({
    orderedVisible,
    hierarchyByLabel,
    labels,
    labelNames,
    radius,
  });

  const links = baseLinks
    .map((link) => {
      const source = indexMap.get(link.source);
      const target = indexMap.get(link.target);
      if (source === undefined || target === undefined) return null;
      return { ...link, source, target };
    })
    .filter((link): link is CircularLink => link !== null);

  return {
    nodes,
    links,
    degreeById,
  };
};
