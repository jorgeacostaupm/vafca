import { buildDegreeByLabelId, buildFilteredUndirectedLinks } from "@/components/nodelink/graphModel";
import {
  CIRCULAR_LABEL_FALLBACK_CHAR_WIDTH_RATIO,
  CIRCULAR_LABEL_FONT_SIZE,
  CIRCULAR_LABEL_OFFSET,
  CIRCULAR_LABEL_SELECTION_BACKGROUND_PADDING_X,
  CIRCULAR_LAYOUT_EDGE_PADDING,
  CIRCULAR_NODE_RADIUS,
} from "@/config/ui";
import type { AtlasDefinition } from "@/types/atlas";
import type {
  CircularLink,
  CircularNode,
  NodeLinkValueFilters,
  UndirectedLink,
} from "@/types/nodelink";
import { buildCircularHierarchyBundleLayout } from "@/utils/circular/hierarchy";

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

let measureCircularLabelText: ((label: string) => number) | null | undefined;

const getCircularLabelTextMeasure = () => {
  if (measureCircularLabelText !== undefined) return measureCircularLabelText;
  if (typeof document === "undefined") {
    measureCircularLabelText = null;
    return measureCircularLabelText;
  }

  const context = document.createElement("canvas").getContext("2d");
  if (!context) {
    measureCircularLabelText = null;
    return measureCircularLabelText;
  }

  context.font = `${CIRCULAR_LABEL_FONT_SIZE}px sans-serif`;
  measureCircularLabelText = (label: string) => context.measureText(label).width;
  return measureCircularLabelText;
};

const getCircularLabelTextWidth = (label: string) => {
  const measureText = getCircularLabelTextMeasure();
  if (measureText) return measureText(label);
  // ponytail: fallback for non-DOM runs; browser canvas measurement is the precise path.
  return label.length * CIRCULAR_LABEL_FONT_SIZE * CIRCULAR_LABEL_FALLBACK_CHAR_WIDTH_RATIO;
};

const getCircularNodeLabel = ({
  item,
  labels,
  labelNames,
}: {
  item: VisibleNodeRef;
  labels?: string[];
  labelNames?: Record<string, string>;
}) => {
  const labelId = labels?.[item.originalIndex];
  return labelId ? labelNames?.[labelId] ?? labelId : String(item.originalIndex);
};

const resolveCircularLayoutRadius = ({
  width,
  height,
  nodeLabels,
}: {
  width: number;
  height: number;
  nodeLabels: string[];
}) => {
  const outerRadius = Math.min(width, height) / 2;
  // ponytail: global widest-label clearance; upgrade to per-angle clearance if this over-shrinks views.
  const maxLabelWidth = nodeLabels.reduce(
    (maxWidth, label) => Math.max(maxWidth, getCircularLabelTextWidth(label)),
    0,
  );
  const labelClearance =
    maxLabelWidth +
    CIRCULAR_LABEL_OFFSET +
    CIRCULAR_LABEL_SELECTION_BACKGROUND_PADDING_X +
    CIRCULAR_NODE_RADIUS +
    CIRCULAR_LAYOUT_EDGE_PADDING;

  return Math.max(0, outerRadius - labelClearance);
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
    const displayLabel = getCircularNodeLabel({ item, labels, labelNames });

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

  const visibleNodeLabels = visibleOriginalIndices.map((item) =>
    getCircularNodeLabel({ item, labels, labelNames }),
  );
  const radius = resolveCircularLayoutRadius({
    width,
    height,
    nodeLabels: visibleNodeLabels,
  });
  const hierarchyLayout = buildCircularHierarchyBundleLayout({
    labelIds: visibleOriginalIndices.map((item) => item.labelId),
    radius,
    atlasDefinition,
    hierarchyFields,
    categoryOrder: hierarchyCategoryOrder,
  });
  const hierarchyByLabel = new Map(
    hierarchyLayout.points.map((item) => [item.labelId, item] as const),
  );

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
    .map((link): CircularLink | null => {
      const source = indexMap.get(link.source);
      const target = indexMap.get(link.target);
      if (source === undefined || target === undefined) return null;
      const bundlePath = hierarchyLayout.pathByLabelPair(link.rowId, link.colId) ?? undefined;
      return bundlePath ? { ...link, source, target, bundlePath } : { ...link, source, target };
    })
    .filter((link): link is CircularLink => link !== null);

  return {
    nodes,
    links,
    degreeById,
  };
};
