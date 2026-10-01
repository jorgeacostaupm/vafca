import * as d3 from "d3";
import type { RefObject } from "react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { renderCircularScene } from "@/components/circular/circularSceneRenderer";
import { applyCircularHoverSelectionStyles } from "@/components/circular/circularVisualEffects";
import type { TooltipValueLabel } from "@/components/common/tooltipValueLabel";
import {
  getSharedHoverState,
  type SharedHoverState,
  subscribeSharedHover,
} from "@/components/hover/sharedHover";
import {
  CIRCULAR_NODE_RADIUS,
  SHARED_HOVER_GRAPH_SYNC_THROTTLE_MS,
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

type UseCircularSceneArgs = {
  svgRefProp?: RefObject<SVGSVGElement | null>;
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
  valueLabel: TooltipValueLabel;
};

const getHoverCell = (hoverState: SharedHoverState) =>
  hoverState?.type === "cell"
    ? { rowId: hoverState.rowId, colId: hoverState.colId }
    : null;

const getHoverNodeId = (hoverState: SharedHoverState) =>
  hoverState?.type === "node" ? hoverState.nodeId : null;

export const useCircularScene = ({
  svgRefProp,
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
}: UseCircularSceneArgs) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const svgRef = svgRefProp ?? internalSvgRef;
  const tooltipRef = useRef<HTMLDivElement>(null);
  const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const [localHoverActive, setLocalHoverActive] = useState(false);
  const linkSelectionRef = useRef<
    d3.Selection<SVGPathElement, CircularLink, SVGGElement, unknown> | null
  >(null);
  const nodeSelectionRef = useRef<
    d3.Selection<SVGCircleElement, CircularNode, SVGGElement, unknown> | null
  >(null);
  const labelSelectionRef = useRef<
    d3.Selection<SVGTextElement, CircularNode, SVGGElement, unknown> | null
  >(null);
  const widthScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
  const zoomLabelSetRef = useRef<Set<string> | null>(null);
  const nodeRadiusRef = useRef(CIRCULAR_NODE_RADIUS);
  const interactionState = useEffectEvent(() => ({
    selectedLinkIds, visualStyle, onLabelToggle, onLinkSelect, onBrushSelectLinks, onBrushDeselectLinks,
  }));

  useEffect(() => {
    if (!svgRef.current) return;

    const scene = renderCircularScene({
      svgElement: svgRef.current,
      wrapperElement: wrapperRef.current,
      tooltipElement: tooltipRef.current,
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
      brushMode,
      geometricZoomEnabled,
      selectedLinkIds: interactionState().selectedLinkIds,
      visualStyle: interactionState().visualStyle,
      linkColorResolver,
      onLabelToggle: payload => interactionState().onLabelToggle?.(payload),
      onLinkSelect: payload => interactionState().onLinkSelect?.(payload),
      onLinkHover,
      onLinkLeave,
      onNodeHover,
      onNodeLeave,
      onBrushZoom,
      onBrushSelectLinks: payload => interactionState().onBrushSelectLinks?.(payload),
      onBrushDeselectLinks: payload => interactionState().onBrushDeselectLinks?.(payload),
      getNodeColor,
      valueLabel,
      setLocalHoverActive,
      zoomTransformRef,
    });

    if (!scene) {
      linkSelectionRef.current = null;
      nodeSelectionRef.current = null;
      labelSelectionRef.current = null;
      widthScaleRef.current = null;
      zoomLabelSetRef.current = null;
      return;
    }

    const hover = getSharedHoverState();
    applyCircularHoverSelectionStyles({
      ...scene, selectedLinkIds: interactionState().selectedLinkIds,
      visualStyle: interactionState().visualStyle, linkColorResolver, getNodeColor,
      hoveredCell: getHoverCell(hover), hoveredNodeId: getHoverNodeId(hover),
    });
    linkSelectionRef.current = scene.linkSelection;
    nodeSelectionRef.current = scene.nodeSelection;
    labelSelectionRef.current = scene.labelSelection;
    widthScaleRef.current = scene.widthScale;
    zoomLabelSetRef.current = scene.zoomLabelSet;
    nodeRadiusRef.current = scene.nodeRadius ?? CIRCULAR_NODE_RADIUS;
  }, [
    svgRef,
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
    brushMode,
    geometricZoomEnabled,
    linkColorResolver,
    onLinkHover,
    onLinkLeave,
    onNodeHover,
    onNodeLeave,
    onBrushZoom,
    getNodeColor,
    valueLabel,
  ]);

  useEffect(() => {
    const applyHover = (hoverState: SharedHoverState) => {
      const linkSelection = linkSelectionRef.current;
      const nodeSelection = nodeSelectionRef.current;
      const labelSelection = labelSelectionRef.current;
      const widthScale = widthScaleRef.current;
      if (!linkSelection || !nodeSelection || !labelSelection || !widthScale) {
        return;
      }

      applyCircularHoverSelectionStyles({
        linkSelection,
        nodeSelection,
        labelSelection,
        widthScale,
        zoomLabelSet: zoomLabelSetRef.current,
        nodeRadius: nodeRadiusRef.current,
        hoveredCell: getHoverCell(hoverState),
        hoveredNodeId: getHoverNodeId(hoverState),
        selectedLinkIds,
        visualStyle,
        linkColorResolver,
        getNodeColor,
      });
    };

    applyHover(getSharedHoverState());
    return subscribeSharedHover(applyHover, {
      throttleMs: SHARED_HOVER_GRAPH_SYNC_THROTTLE_MS,
    });
  }, [getNodeColor, linkColorResolver, selectedLinkIds, visualStyle]);

  return {
    wrapperRef,
    svgRef,
    tooltipRef,
    zoomTransformRef,
    localHoverActive,
  };
};
