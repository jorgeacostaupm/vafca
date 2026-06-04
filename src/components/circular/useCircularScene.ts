import * as d3 from "d3";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

import { renderCircularScene } from "@/components/circular/circularSceneRenderer";
import { applyCircularHoverSelectionStyles } from "@/components/circular/circularVisualEffects";
import {
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
  valueLabel: string;
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
    });

    if (!scene) return;

    const applyHover = (hoverState: SharedHoverState) =>
      applyCircularHoverSelectionStyles({
        linkSelection: scene.linkSelection,
        nodeSelection: scene.nodeSelection,
        labelSelection: scene.labelSelection,
        widthScale: scene.widthScale,
        zoomLabelSet: scene.zoomLabelSet,
        nodeRadius: scene.nodeRadius ?? CIRCULAR_NODE_RADIUS,
        hoveredCell: getHoverCell(hoverState),
        hoveredNodeId: getHoverNodeId(hoverState),
        selectedLinkIds,
        visualStyle,
        linkColorResolver,
        getNodeColor,
      });

    return subscribeSharedHover(applyHover, {
      throttleMs: SHARED_HOVER_GRAPH_SYNC_THROTTLE_MS,
    });
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
  ]);

  return {
    wrapperRef,
    svgRef,
    tooltipRef,
    zoomTransformRef,
    localHoverActive,
  };
};
