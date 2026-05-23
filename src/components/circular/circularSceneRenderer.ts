import * as d3 from "d3";
import type { MutableRefObject } from "react";
import {
  DEFAULT_LINK_WIDTH_RANGE,
  NODELINK_TOOLTIP_OFFSET,
} from "@/components/nodelink/nodelinkShared";
import { positionTooltipForPointer } from "@/components/nodelink/tooltipPosition";
import { renderCircularElements } from "@/components/circular/circularRenderStrategies";
import { CIRCULAR_NODE_RADIUS } from "@/config/ui";
import type { CircularLink, CircularNode } from "@/types/nodelink";

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
  labelAcronyms?: Record<string, string>;
  nodes: CircularNode[];
  links: CircularLink[];
  degreeById: Map<string, number>;
  selectedZoomLabels?: string[];
  linkWidthRange?: [number, number];
  circularLinkTension?: number;
  circularBundlingEnabled?: boolean;
  brushEnabled: boolean;
  geometricZoomEnabled: boolean;
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
  getNodeColor: (node: CircularNode) => string;
  valueLabel?: string;
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
}: {
  links: CircularLink[];
  linkWidthRange?: [number, number];
}) => {
  const widthRange = linkWidthRange ?? DEFAULT_LINK_WIDTH_RANGE;
  const extent = d3.extent(links, (link: CircularLink) => Math.abs(link.value));
  const extentMin = Number.isFinite(extent[0]) ? (extent[0] as number) : 0;
  const extentMax = Number.isFinite(extent[1]) ? (extent[1] as number) : 1;

  return d3
    .scaleLinear()
    .domain(extentMin === extentMax ? [0, extentMax || 1] : [extentMin, extentMax])
    .range(widthRange)
    .clamp(true);
};

const createTooltipHandlers = ({
  wrapperElement,
  tooltipElement,
  setLocalHoverActive,
}: {
  wrapperElement: HTMLDivElement | null;
  tooltipElement: HTMLDivElement | null;
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

  return { showTooltip, moveTooltip, hideTooltip };
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

const applyBrushBehavior = ({
  svg,
  width,
  height,
  labels,
  nodes,
  centerX,
  centerY,
  onBrushZoom,
  zoomTransformRef,
  hideTooltip,
}: {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  labels?: string[];
  nodes: CircularNode[];
  centerX: number;
  centerY: number;
  onBrushZoom?: (payload: { labels: string[] }) => void;
  zoomTransformRef: MutableRefObject<d3.ZoomTransform>;
  hideTooltip: () => void;
}) => {
  const brushLayer = svg.append("g").attr("class", "node-link-brush");
  const brush = d3
    .brush()
    .extent([
      [0, 0],
      [width, height],
    ])
    .on("end", (event: d3.D3BrushEvent<unknown>) => {
      if (!event.selection) return;
      hideTooltip();

      const [[x0, y0], [x1, y1]] = event.selection as [[number, number], [number, number]];
      const transform = zoomTransformRef.current ?? d3.zoomIdentity;
      const [minX, minY] = transform.invert([Math.min(x0, x1), Math.min(y0, y1)]);
      const [maxX, maxY] = transform.invert([Math.max(x0, x1), Math.max(y0, y1)]);

      const selectedIds: string[] = [];
      nodes.forEach((node) => {
        const x = node.x + centerX;
        const y = node.y + centerY;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          selectedIds.push(node.labelId ?? String(node.id));
        }
      });

      const selectedSet = new Set(selectedIds);
      const orderedSelection =
        labels && labels.length > 0 ? labels.filter((label) => selectedSet.has(label)) : selectedIds;

      if (orderedSelection.length > 0) {
        onBrushZoom?.({ labels: orderedSelection });
      }

      brushLayer.call(brush.move, null);
    });

  brushLayer.call(brush);
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
  labelAcronyms,
  nodes,
  links,
  degreeById,
  selectedZoomLabels,
  linkWidthRange,
  circularLinkTension,
  circularBundlingEnabled,
  brushEnabled,
  geometricZoomEnabled,
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

  const { showTooltip, moveTooltip, hideTooltip } = createTooltipHandlers({
    wrapperElement,
    tooltipElement,
    setLocalHoverActive,
  });

  const widthScale = createWidthScale({ links, linkWidthRange });
  const zoomLabelSet =
    selectedZoomLabels && selectedZoomLabels.length > 0 ? new Set(selectedZoomLabels) : null;
  const nodeRadius = CIRCULAR_NODE_RADIUS;

  const { linkSelection, nodeSelection, labelSelection } = renderCircularElements({
    root,
    nodes,
    links,
    diverging,
    labelNames,
    labelTitles,
    labelAcronyms,
    selectedLinkIds,
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
    applyBrushBehavior({
      svg,
      width,
      height,
      labels,
      nodes,
      centerX,
      centerY,
      onBrushZoom,
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
