import * as d3 from "d3";
import {
  type RefObject,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import type { TooltipValueLabel } from "@/components/common/tooltipValueLabel";
import { getSharedHoverState } from "@/components/hover/sharedHover";
import { renderClassicScene } from "@/components/nodelink/sceneRenderer";
import { useClassicProgrammaticTooltip } from "@/components/nodelink/useProgrammaticTooltip";
import { useClassicSelectionStyles } from "@/components/nodelink/useSelectionStyles";
import { applyClassicHoverSelectionStyles } from "@/components/nodelink/visualEffects";
import type { MatrixBrushMode } from "@/types/matrixHeatmap";
import type {
  ClassicLink,
  ClassicNode,
  NodeLinkBrushLink,
  NodeLinkInteractionProps,
  NodeLinkValueFilters,
} from "@/types/nodelink";
import type { ResolvedValueDomain } from "@/types/valueDomain";

type UseClassicNodeLinkSceneArgs = NodeLinkInteractionProps & {
  data: number[][];
  labels?: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  width: number;
  height: number;
  svgRef: RefObject<SVGSVGElement | null>;
  valueFilters?: NodeLinkValueFilters;
  selectedZoomLabels?: string[];
  linkWidthRange?: [number, number];
  valueDomain?: ResolvedValueDomain;
  brushEnabled?: boolean;
  brushMode?: MatrixBrushMode;
  geometricZoomEnabled?: boolean;
  hideIsolatedNodes?: boolean;
  onLabelToggle?: (label: string) => void;
  onBrushZoom?: (payload: { labels: string[] }) => void;
  onBrushSelectLinks?: (payload: { links: NodeLinkBrushLink[] }) => void;
  onBrushDeselectLinks?: (payload: { links: NodeLinkBrushLink[] }) => void;
  getNodeColor: (node: ClassicNode) => string;
  valueLabel: TooltipValueLabel;
};

export const useClassicNodeLinkScene = ({
  data,
  labels,
  labelNames,
  labelTitles,
  labelAcronyms,
  width,
  height,
  svgRef,
  valueFilters,
  selectedZoomLabels,
  linkWidthRange,
  valueDomain,
  brushEnabled = false,
  brushMode = "zoom",
  geometricZoomEnabled = false,
  hideIsolatedNodes = true,
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
}: UseClassicNodeLinkSceneArgs) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const localHoverActiveRef = useRef(false);
  const [hoverSyncRevision, setHoverSyncRevision] = useState(0);
  const setLocalHoverActive = useCallback((active: boolean) => {
    if (localHoverActiveRef.current === active) {
      return;
    }
    localHoverActiveRef.current = active;
    setHoverSyncRevision((prev) => prev + 1);
  }, []);

  const resetLocalHoverActive = useCallback(() => {
    localHoverActiveRef.current = false;
  }, []);

  const nodesRef = useRef<ClassicNode[] | null>(null);
  const linksRef = useRef<ClassicLink[] | null>(null);
  const degreeByIdRef = useRef<Map<string, number> | null>(null);
  const widthScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
  const nodeRadiusRef = useRef(3.5);
  const zoomLabelSetRef = useRef<Set<string> | null>(null);
  const linkSelectionRef = useRef<
    d3.Selection<SVGLineElement, ClassicLink, SVGGElement, unknown> | null
  >(null);
  const nodeSelectionRef = useRef<
    d3.Selection<SVGCircleElement, ClassicNode, SVGGElement, unknown> | null
  >(null);
  const labelSelectionRef = useRef<
    d3.Selection<SVGTextElement, ClassicNode, SVGGElement, unknown> | null
  >(null);
  const interactionState = useEffectEvent(() => ({
    selectedLinkIds, visualStyle, onLabelToggle, onLinkSelect, onBrushSelectLinks, onBrushDeselectLinks,
  }));

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    const result = renderClassicScene({
      svgElement: svgRef.current,
      wrapperElement: wrapperRef.current,
      tooltipElement: tooltipRef.current,
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
      brushMode,
      geometricZoomEnabled,
      hideIsolatedNodes,
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
      resetLocalHoverActive,
      setLocalHoverActive,
      zoomTransformRef,
    });

    if (!result) {
      nodesRef.current = null;
      linksRef.current = null;
      degreeByIdRef.current = null;
      widthScaleRef.current = null;
      return;
    }

    const hover = getSharedHoverState();
    applyClassicHoverSelectionStyles({
      ...result, selectedLinkIds: interactionState().selectedLinkIds,
      visualStyle: interactionState().visualStyle, linkColorResolver, getNodeColor,
      hoveredCell: hover?.type === 'cell' ? hover : null,
      hoveredNodeId: hover?.type === 'node' ? hover.nodeId : null,
    });
    nodesRef.current = result.nodes;
    linksRef.current = result.links;
    degreeByIdRef.current = result.degreeById;
    linkSelectionRef.current = result.linkSelection;
    nodeSelectionRef.current = result.nodeSelection;
    labelSelectionRef.current = result.labelSelection;
    widthScaleRef.current = result.widthScale;
    nodeRadiusRef.current = result.nodeRadius;
    zoomLabelSetRef.current = result.zoomLabelSet;
  }, [
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
    brushMode,
    geometricZoomEnabled,
    hideIsolatedNodes,
    linkColorResolver,
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
    svgRef,
  ]);

  useClassicSelectionStyles({
    linkSelectionRef,
    nodeSelectionRef,
    labelSelectionRef,
    widthScaleRef,
    zoomLabelSetRef,
    nodeRadiusRef,
    selectedLinkIds,
    visualStyle,
    linkColorResolver,
    getNodeColor,
  });

  useClassicProgrammaticTooltip({
    tooltipRef,
    wrapperRef,
    localHoverActiveRef,
    hoverSyncRevision,
    width,
    height,
    nodesRef,
    linksRef,
    degreeByIdRef,
    labelNames,
    labelTitles,
    labelAcronyms,
    valueLabel,
    zoomTransformRef,
  });

  return {
    wrapperRef,
    tooltipRef,
  };
};
