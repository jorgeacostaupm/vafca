import * as d3 from "d3";
import type { MutableRefObject } from "react";

import { renderClassicElements } from "@/components/nodelink/renderStrategies";
import {
  configureClassicBrush,
  configureClassicZoom,
  createClassicTooltipHandlers,
} from "@/components/nodelink/sceneBehaviors";
import {
  buildClassicSceneModel,
  DEFAULT_MARGIN,
} from "@/components/nodelink/sceneModel";
import type { MatrixBrushMode } from "@/types/matrixHeatmap";
import type {
  ClassicLink,
  ClassicNode,
  NetworkLinkColorResolver,
  NodeLinkBrushLink,
  NodeLinkValueFilters,
} from "@/types/nodelink";
import type { ResolvedValueDomain } from "@/types/valueDomain";
import type { MatrixVisualStyle } from "@/types/visualizationUi";

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
  valueDomain?: ResolvedValueDomain;
  brushEnabled: boolean;
  brushMode?: MatrixBrushMode;
  geometricZoomEnabled: boolean;
  hideIsolatedNodes: boolean;
  selectedLinkIds: Set<string>;
  visualStyle: MatrixVisualStyle;
  linkColorResolver: NetworkLinkColorResolver;
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
  onBrushSelectLinks?: (payload: { links: NodeLinkBrushLink[] }) => void;
  onBrushDeselectLinks?: (payload: { links: NodeLinkBrushLink[] }) => void;
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
  valueDomain,
  brushEnabled,
  brushMode = "zoom",
  geometricZoomEnabled,
  hideIsolatedNodes,
  selectedLinkIds,
  visualStyle,
  linkColorResolver,
  onLabelToggle,
  onLinkSelect,
  onLinkHover,
  onLinkLeave,
  onNodeHover,
  onNodeLeave,
  onBrushZoom,
  onBrushSelectLinks,
  onBrushDeselectLinks,
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
    valueDomain,
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
    labelNames,
    labelTitles,
    labelAcronyms,
    selectedLinkIds,
    visualStyle,
    linkColorResolver,
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
      labelNames,
      simNodes: model.simNodes,
      linkSelection:
        linkSelection as d3.Selection<SVGLineElement, ClassicLink, SVGGElement, unknown>,
      clampX: model.clampX,
      clampY: model.clampY,
      zoomTransformRef,
      brushMode,
      onBrushZoom,
      onBrushSelectLinks,
      onBrushDeselectLinks,
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
