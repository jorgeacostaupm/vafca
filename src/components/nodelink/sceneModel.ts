import * as d3 from "d3";
import type {
  ClassicLink,
  ClassicNode,
  NodeLinkValueFilters,
  UndirectedLink,
} from "@/types/nodelink";
import { DEFAULT_LINK_WIDTH_RANGE } from "@/components/nodelink/nodelinkShared";
import { NODE_LINK_LAYOUT_MARGIN, NODE_LINK_NODE_RADIUS } from "@/config/ui";
import { computeForceLayout } from "@/components/nodelink/forceLayout";
import {
  buildDegreeByLabelId,
  buildFilteredUndirectedLinks,
} from "@/components/nodelink/graphModel";

export const DEFAULT_NODE_RADIUS = NODE_LINK_NODE_RADIUS;
export const DEFAULT_MARGIN = NODE_LINK_LAYOUT_MARGIN;

type BuildClassicSceneModelArgs = {
  data: number[][];
  labels?: string[];
  labelNames?: Record<string, string>;
  valueFilters?: NodeLinkValueFilters;
  hideIsolatedNodes: boolean;
  selectedZoomLabels?: string[];
  linkWidthRange?: [number, number];
  width: number;
  height: number;
};

export type ClassicSceneModel = {
  simNodes: ClassicNode[];
  simLinks: ClassicLink[];
  degreeById: Map<string, number>;
  widthScale: d3.ScaleLinear<number, number>;
  nodeRadius: number;
  zoomLabelSet: Set<string> | null;
  clampX: (value: number | undefined) => number;
  clampY: (value: number | undefined) => number;
};

const resolveLinks = (args: {
  data: number[][];
  labels?: string[];
  valueFilters?: NodeLinkValueFilters;
}) => buildFilteredUndirectedLinks(args).map((link: UndirectedLink) => ({ ...link }));

const buildNodes = (args: {
  count: number;
  labels?: string[];
  labelNames?: Record<string, string>;
}) => {
  const { count, labels, labelNames } = args;
  return Array.from({ length: count }, (_, index) => {
    const labelId = labels?.[index];
    const label = labelId ? labelNames?.[labelId] ?? labelId : String(index);
    return { id: index, labelId, label } satisfies ClassicNode;
  });
};

const buildVisibleNodeIndexes = (args: {
  nodes: ClassicNode[];
  degreeById: Map<string, number>;
  hideIsolatedNodes: boolean;
}) => {
  const { nodes, degreeById, hideIsolatedNodes } = args;
  if (!hideIsolatedNodes) {
    return nodes.map((_, index) => index);
  }

  return nodes
    .map((node, index) => ({ node, index }))
    .filter((entry) => degreeById.has(entry.node.labelId ?? String(entry.node.id)))
    .map((entry) => entry.index);
};

const remapVisibleGraph = (args: {
  nodes: ClassicNode[];
  links: ClassicLink[];
  visibleNodeIndexes: number[];
}) => {
  const { nodes, links, visibleNodeIndexes } = args;
  const nextIndexByOriginal = new Map<number, number>();
  visibleNodeIndexes.forEach((originalIndex, visibleIndex) => {
    nextIndexByOriginal.set(originalIndex, visibleIndex);
  });

  const simNodes = visibleNodeIndexes.map((originalIndex, visibleIndex) => ({
    ...nodes[originalIndex],
    id: visibleIndex,
  }));

  const simLinks = links.reduce<ClassicLink[]>((acc, link) => {
    const sourceIndex =
      typeof link.source === "number" ? link.source : (link.source as ClassicNode).id;
    const targetIndex =
      typeof link.target === "number" ? link.target : (link.target as ClassicNode).id;
    const source = nextIndexByOriginal.get(sourceIndex);
    const target = nextIndexByOriginal.get(targetIndex);
    if (source === undefined || target === undefined) {
      return acc;
    }
    acc.push({ ...link, source, target });
    return acc;
  }, []);

  return { simNodes, simLinks };
};

const buildWidthScale = (args: {
  links: ClassicLink[];
  linkWidthRange?: [number, number];
}) => {
  const { links, linkWidthRange } = args;
  const widthRange = linkWidthRange ?? DEFAULT_LINK_WIDTH_RANGE;
  const extent = d3.extent(links, (link) => Math.abs(link.value));
  const extentMin = Number.isFinite(extent[0]) ? (extent[0] as number) : 0;
  const extentMax = Number.isFinite(extent[1]) ? (extent[1] as number) : 1;

  return d3
    .scaleLinear<number, number>()
    .domain(extentMin === extentMax ? [0, extentMax || 1] : [extentMin, extentMax])
    .range(widthRange)
    .clamp(true);
};

export const buildClassicSceneModel = ({
  data,
  labels,
  labelNames,
  valueFilters,
  hideIsolatedNodes,
  selectedZoomLabels,
  linkWidthRange,
  width,
  height,
}: BuildClassicSceneModelArgs): ClassicSceneModel => {
  const count = data.length;
  const nodes = buildNodes({ count, labels, labelNames });
  const links = resolveLinks({ data, labels, valueFilters });
  const degreeById = buildDegreeByLabelId(links);

  const visibleNodeIndexes = buildVisibleNodeIndexes({
    nodes,
    degreeById,
    hideIsolatedNodes,
  });

  const { simNodes, simLinks } = remapVisibleGraph({
    nodes,
    links,
    visibleNodeIndexes,
  });

  const minDim = Math.min(width, height);
  const nodeRadius = Math.max(2.5, Math.min(DEFAULT_NODE_RADIUS, minDim / 50));

  computeForceLayout({
    nodes: simNodes,
    links: simLinks,
    width,
    height,
    nodeRadius,
  });

  const clampX = (value: number | undefined) =>
    Math.max(DEFAULT_MARGIN, Math.min(width - DEFAULT_MARGIN, value ?? width / 2));
  const clampY = (value: number | undefined) =>
    Math.max(DEFAULT_MARGIN, Math.min(height - DEFAULT_MARGIN, value ?? height / 2));

  const widthScale = buildWidthScale({ links, linkWidthRange });
  const zoomLabelSet =
    selectedZoomLabels && selectedZoomLabels.length > 0
      ? new Set(selectedZoomLabels)
      : null;

  return {
    simNodes,
    simLinks,
    degreeById,
    widthScale,
    nodeRadius,
    zoomLabelSet,
    clampX,
    clampY,
  };
};
