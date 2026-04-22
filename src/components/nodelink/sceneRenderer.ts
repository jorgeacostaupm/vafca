import * as d3 from "d3";
import type { MutableRefObject } from "react";
import {
  DEFAULT_MARGIN,
  buildClassicSceneModel,
} from "@/components/nodelink/sceneModel";
import {
  configureClassicBrush,
  configureClassicZoom,
  createClassicTooltipHandlers,
} from "@/components/nodelink/sceneBehaviors";
import { renderClassicElements } from "@/components/nodelink/renderStrategies";
import type {
  ClassicLink,
  ClassicNode,
  NodeLinkValueFilters,
} from "@/types/nodelink";

type ClassicSceneRenderArgs = {
  svgElement: SVGSVGElement;
  wrapperElement: HTMLDivElement | null;
  tooltipElement: HTMLDivElement | null;
  data: number[][];
  labels?: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  width: number;
  height: number;
  valueFilters?: NodeLinkValueFilters;
  selectedZoomLabels?: string[];
  linkWidthRange?: [number, number];
  brushEnabled: boolean;
  geometricZoomEnabled: boolean;
  hideIsolatedNodes: boolean;
  diverging?: boolean;
  selectedLinkIds: Set<string>;
  onLabelToggle?: (label: string) => void;
  onLinkSelect: (payload: {
    rowId: string;
    colId: string;
    value: number;
    rowLabel: string;
    colLabel: string;
  }) => void;
  onLinkHover?: (payload: { rowId: string; colId: string }) => void;
  onLinkLeave?: () => void;
  onNodeHover?: (id: string) => void;
  onNodeLeave?: () => void;
  onBrushZoom?: (payload: { labels: string[] }) => void;
  getNodeColor: (node: ClassicNode) => string;
  valueLabel: string;
  resetLocalHoverActive: () => void;
  setLocalHoverActive: (active: boolean) => void;
  zoomTransformRef: MutableRefObject<d3.ZoomTransform>;
};

export type ClassicSceneRenderResult = {
  nodes: ClassicNode[];
  links: ClassicLink[];
  degreeById: Map<string, number>;
  linkSelection: d3.Selection<SVGLineElement, ClassicLink, SVGGElement, unknown>;
  nodeSelection: d3.Selection<SVGCircleElement, ClassicNode, SVGGElement, unknown>;
  labelSelection: d3.Selection<SVGTextElement, ClassicNode, SVGGElement, unknown>;
  widthScale: d3.ScaleLinear<number, number>;
  nodeRadius: number;
  zoomLabelSet: Set<string> | null;
};

export const renderClassicScene = ({
  svgElement,
  wrapperElement,
  tooltipElement,
  data,
  labels,
  labelNames,
  labelTitles,
  labelAcronyms,
  width,
  height,
  valueFilters,
  selectedZoomLabels,
  linkWidthRange,
  brushEnabled,
  geometricZoomEnabled,
  hideIsolatedNodes,
  diverging,
  selectedLinkIds,
  onLabelToggle,
  onLinkSelect,
  onLinkHover,
  onLinkLeave,
  onNodeHover,
  onNodeLeave,
  onBrushZoom,
  getNodeColor,
  valueLabel,
  resetLocalHoverActive,
  setLocalHoverActive,
  zoomTransformRef,
}: ClassicSceneRenderArgs): ClassicSceneRenderResult | null => {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  if (tooltipElement) {
    tooltipElement.style.opacity = "0";
  }
  resetLocalHoverActive();

  if (width <= 0 || height <= 0) {
    return null;
  }

  const model = buildClassicSceneModel({
    data,
    labels,
    labelNames,
    valueFilters,
    hideIsolatedNodes,
    selectedZoomLabels,
    linkWidthRange,
    width,
    height,
  });

  const zoomRoot = svg.append("g").attr("class", "node-link-zoom-root");
  const root = zoomRoot.append("g").attr("class", "node-link-root");

  const { showTooltip, moveTooltip, hideTooltip } = createClassicTooltipHandlers({
    wrapperEl: wrapperElement,
    tooltipEl: tooltipElement,
    setLocalHoverActive,
  });

  const { linkSelection, nodeSelection, labelSelection } = renderClassicElements({
    root,
    simNodes: model.simNodes,
    simLinks: model.simLinks,
    width,
    height,
    diverging,
    labelNames,
    labelTitles,
    labelAcronyms,
    selectedLinkIds,
    widthScale: model.widthScale,
    nodeRadius: model.nodeRadius,
    zoomLabelSet: model.zoomLabelSet,
    degreeById: model.degreeById,
    onLabelToggle,
    onLinkSelect,
    onLinkHover,
    onLinkLeave,
    onNodeHover,
    onNodeLeave,
    getNodeColor,
    valueLabel,
    showTooltip,
    moveTooltip,
    hideTooltip,
    setLocalHoverActive,
    clampX: model.clampX,
    clampY: model.clampY,
    defaultMargin: DEFAULT_MARGIN,
  });

  configureClassicZoom({
    svg,
    zoomRoot,
    geometricZoomEnabled,
    brushEnabled,
    zoomTransformRef,
  });

  if (brushEnabled) {
    configureClassicBrush({
      svg,
      width,
      height,
      labels,
      simNodes: model.simNodes,
      clampX: model.clampX,
      clampY: model.clampY,
      zoomTransformRef,
      onBrushZoom,
      hideTooltip,
    });
  }

  return {
    nodes: model.simNodes,
    links: model.simLinks,
    degreeById: model.degreeById,
    linkSelection:
      linkSelection as d3.Selection<SVGLineElement, ClassicLink, SVGGElement, unknown>,
    nodeSelection:
      nodeSelection as d3.Selection<SVGCircleElement, ClassicNode, SVGGElement, unknown>,
    labelSelection:
      labelSelection as d3.Selection<SVGTextElement, ClassicNode, SVGGElement, unknown>,
    widthScale: model.widthScale,
    nodeRadius: model.nodeRadius,
    zoomLabelSet: model.zoomLabelSet,
  };
};
