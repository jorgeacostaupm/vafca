import * as d3 from "d3";
import type { MutableRefObject } from "react";

import { applyCircularBrushBehavior } from "@/components/circular/circularBrush";
import { renderCircularElements } from "@/components/circular/circularRenderStrategies";
import { positionCircularTooltipForNode } from "@/components/circular/circularTooltipPosition";
import type { TooltipValueLabel } from "@/components/common/tooltipValueLabel";
import { positionTooltipForPointer } from "@/components/nodelink/tooltipPosition";
import {
  CIRCULAR_NODE_RADIUS,
  CIRCULAR_TOOLTIP_EDGE_PADDING,
  CIRCULAR_TOOLTIP_OFFSET,
  DEFAULT_LINK_WIDTH_RANGE,
  NODELINK_TOOLTIP_OFFSET,
} from "@/config/ui";
import type { MatrixBrushMode } from "@/types/matrixHeatmap";
import type {
  CircularLink,
  CircularNode,
  NetworkLinkColorResolver,
  NodeLinkBrushLink,
} from "@/types/nodelink";
import type { ResolvedValueDomain } from "@/types/valueDomain";
import type { MatrixVisualStyle } from "@/types/visualizationUi";

type CircularLinkSelection = d3.Selection<SVGPathElement, CircularLink, SVGGElement, unknown>;
type CircularNodeSelection = d3.Selection<SVGCircleElement, CircularNode, SVGGElement, unknown>;
type CircularLabelSelection = d3.Selection<SVGTextElement, CircularNode, SVGGElement, unknown>;

type CircularSceneRenderArgs = {
  svgElement: SVGSVGElement;
  wrapperElement: HTMLDivElement | null;
  tooltipElement: HTMLDivElement | null;
  width: number;
  height: number;
  labels?: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  nodes: CircularNode[];
  links: CircularLink[];
  degreeById: Map<string, number>;
  selectedZoomLabels?: string[];
  linkWidthRange?: [number, number];
  valueDomain?: ResolvedValueDomain;
  circularLinkTension?: number;
  circularBundlingEnabled?: boolean;
  brushEnabled: boolean;
  brushMode?: MatrixBrushMode;
  geometricZoomEnabled: boolean;
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
  getNodeColor: (node: CircularNode) => string;
  valueLabel?: TooltipValueLabel;
  setLocalHoverActive: (active: boolean) => void;
  zoomTransformRef: MutableRefObject<d3.ZoomTransform>;
};

type CircularSceneRenderResult = {
  linkSelection: CircularLinkSelection;
  nodeSelection: CircularNodeSelection;
  labelSelection: CircularLabelSelection;
  widthScale: d3.ScaleLinear<number, number>;
  nodeRadius: number;
  zoomLabelSet: Set<string> | null;
};

const createWidthScale = ({
  links,
  linkWidthRange,
  valueDomain,
}: {
  links: CircularLink[];
  linkWidthRange?: [number, number];
  valueDomain?: ResolvedValueDomain;
}) => {
  const widthRange = linkWidthRange ?? DEFAULT_LINK_WIDTH_RANGE;
  const extent = d3.extent(links, (link: CircularLink) => Math.abs(link.value));
  const extentMax = Number.isFinite(extent[1]) ? (extent[1] as number) : 1;
  const domainMax = valueDomain
    ? Math.max(Math.abs(valueDomain.min), Math.abs(valueDomain.max))
    : extentMax;

  return d3
    .scaleLinear()
    .domain([0, domainMax || extentMax || 1])
    .range(widthRange)
    .clamp(true);
};

const createTooltipHandlers = ({
  wrapperElement,
  tooltipElement,
  width,
  height,
  zoomTransformRef,
  setLocalHoverActive,
}: {
  wrapperElement: HTMLDivElement | null;
  tooltipElement: HTMLDivElement | null;
  width: number;
  height: number;
  zoomTransformRef: MutableRefObject<d3.ZoomTransform>;
  setLocalHoverActive: (active: boolean) => void;
}) => {
  const showTooltip = (html: string, event: MouseEvent | PointerEvent) => {
    if (!tooltipElement || !wrapperElement) return;
    tooltipElement.innerHTML = html;
    tooltipElement.style.opacity = "1";
    setLocalHoverActive(true);

    const wrapperRect = wrapperElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const { left, top } = positionTooltipForPointer({
      event,
      wrapperRect,
      tooltipRect,
      offset: NODELINK_TOOLTIP_OFFSET,
    });
    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.top = `${top}px`;
  };

  const showNodeTooltip = (html: string, node: CircularNode) => {
    if (!tooltipElement || !wrapperElement) return;
    tooltipElement.innerHTML = html;
    tooltipElement.style.opacity = "1";
    setLocalHoverActive(true);

    const wrapperRect = wrapperElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;
    const [anchorX, anchorY] = (zoomTransformRef.current ?? d3.zoomIdentity).apply([
      centerX + node.x,
      centerY + node.y,
    ]);
    const [screenCenterX, screenCenterY] = (zoomTransformRef.current ?? d3.zoomIdentity).apply([
      centerX,
      centerY,
    ]);
    const { left, top } = positionCircularTooltipForNode({
      anchorX,
      anchorY,
      centerX: screenCenterX,
      centerY: screenCenterY,
      wrapperRect,
      tooltipRect,
      offset: CIRCULAR_TOOLTIP_OFFSET,
      edgePadding: CIRCULAR_TOOLTIP_EDGE_PADDING,
    });
    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.top = `${top}px`;
  };

  const moveTooltip = (event: MouseEvent | PointerEvent) => {
    if (!tooltipElement || !wrapperElement || tooltipElement.style.opacity !== "1") return;

    const wrapperRect = wrapperElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const { left, top } = positionTooltipForPointer({
      event,
      wrapperRect,
      tooltipRect,
      offset: NODELINK_TOOLTIP_OFFSET,
    });
    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.top = `${top}px`;
  };

  const hideTooltip = () => {
    if (!tooltipElement) return;
    tooltipElement.style.opacity = "0";
    setLocalHoverActive(false);
  };

  return { showTooltip, showNodeTooltip, moveTooltip, hideTooltip };
};

const applyZoomBehavior = ({
  svg,
  zoomRoot,
  brushEnabled,
  geometricZoomEnabled,
  zoomTransformRef,
}: {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  zoomRoot: d3.Selection<SVGGElement, unknown, null, undefined>;
  brushEnabled: boolean;
  geometricZoomEnabled: boolean;
  zoomTransformRef: MutableRefObject<d3.ZoomTransform>;
}) => {
  if (!geometricZoomEnabled) {
    zoomTransformRef.current = d3.zoomIdentity;
    zoomRoot.attr("transform", d3.zoomIdentity.toString());
    svg.on(".zoom", null);
    svg.style("cursor", "default");
    return;
  }

  const zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.6, 6])
    .filter((event: Event & { button?: number }) => {
      if (!brushEnabled) return !event.button;
      return event.type === "wheel";
    })
    .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      zoomTransformRef.current = event.transform;
      zoomRoot.attr("transform", event.transform.toString());
    });

  const initialTransform = zoomTransformRef.current ?? d3.zoomIdentity;
  zoomRoot.attr("transform", initialTransform.toString());
  svg.call(zoomBehavior);
  svg.call(zoomBehavior.transform, initialTransform);
  svg.style("cursor", "grab");
};

export const renderCircularScene = ({
  svgElement,
  wrapperElement,
  tooltipElement,
  width,
  height,
  labels,
  labelNames,
  labelTitles,
  nodes,
  links,
  degreeById,
  selectedZoomLabels,
  linkWidthRange,
  valueDomain,
  circularLinkTension,
  circularBundlingEnabled,
  brushEnabled,
  brushMode = "zoom",
  geometricZoomEnabled,
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
  setLocalHoverActive,
  zoomTransformRef,
}: CircularSceneRenderArgs): CircularSceneRenderResult | null => {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  if (tooltipElement) {
    tooltipElement.style.opacity = "0";
  }
  setLocalHoverActive(false);

  if (width <= 0 || height <= 0) {
    return null;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const zoomRoot = svg.append("g").attr("class", "node-link-zoom-root");
  const root = zoomRoot
    .append("g")
    .attr("class", "node-link-root")
    .attr("transform", `translate(${centerX}, ${centerY})`);

  const { showTooltip, showNodeTooltip, moveTooltip, hideTooltip } = createTooltipHandlers({
    wrapperElement,
    tooltipElement,
    width,
    height,
    zoomTransformRef,
    setLocalHoverActive,
  });

  const widthScale = createWidthScale({ links, linkWidthRange, valueDomain });
  const zoomLabelSet =
    selectedZoomLabels && selectedZoomLabels.length > 0 ? new Set(selectedZoomLabels) : null;
  const nodeRadius = CIRCULAR_NODE_RADIUS;

  const { linkSelection, nodeSelection, labelSelection } = renderCircularElements({
    root,
    nodes,
    links,
    labelNames,
    labelTitles,
    selectedLinkIds,
    visualStyle,
    linkColorResolver,
    widthScale,
    circularLinkTension,
    circularBundlingEnabled,
    nodeRadius,
    zoomLabelSet,
    degreeById,
    onLabelToggle,
    onLinkSelect,
    onLinkHover,
    onLinkLeave,
    onNodeHover,
    onNodeLeave,
    getNodeColor,
    valueLabel,
    showTooltip,
    showNodeTooltip,
    moveTooltip,
    hideTooltip,
    setLocalHoverActive,
  });

  applyZoomBehavior({
    svg,
    zoomRoot,
    brushEnabled,
    geometricZoomEnabled,
    zoomTransformRef,
  });

  if (brushEnabled) {
    applyCircularBrushBehavior({
      svg,
      width,
      height,
      labels,
      labelNames,
      linkSelection: linkSelection as CircularLinkSelection,
      brushMode,
      centerX,
      centerY,
      onBrushZoom,
      onBrushSelectLinks,
      onBrushDeselectLinks,
      zoomTransformRef,
      hideTooltip,
    });
  }

  return {
    linkSelection: linkSelection as CircularLinkSelection,
    nodeSelection: nodeSelection as CircularNodeSelection,
    labelSelection: labelSelection as CircularLabelSelection,
    widthScale,
    nodeRadius,
    zoomLabelSet,
  };
};
