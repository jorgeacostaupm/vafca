import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as d3 from "d3";
import { renderClassicScene } from "@/components/nodelink/sceneRenderer";
import { useClassicProgrammaticTooltip } from "@/components/nodelink/useProgrammaticTooltip";
import { useClassicSelectionStyles } from "@/components/nodelink/useSelectionStyles";
import type {
  ClassicLink,
  ClassicNode,
  NodeLinkInteractionProps,
  NodeLinkValueFilters,
} from "@/types/nodelink";

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
  brushEnabled?: boolean;
  geometricZoomEnabled?: boolean;
  hideIsolatedNodes?: boolean;
  diverging?: boolean;
  onLabelToggle?: (label: string) => void;
  onBrushZoom?: (payload: { labels: string[] }) => void;
  getNodeColor: (node: ClassicNode) => string;
  valueLabel: string;
};

const HOVER_NODE_COLOR = "#d64545";

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
  brushEnabled = false,
  geometricZoomEnabled = false,
  hideIsolatedNodes = true,
  diverging,
  selectedLinkIds,
  hoveredCell,
  hoveredNodeId,
  onLabelToggle,
  onLinkSelect,
  onLinkHover,
  onLinkLeave,
  onNodeHover,
  onNodeLeave,
  onBrushZoom,
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
    });

    if (!result) {
      nodesRef.current = null;
      linksRef.current = null;
      degreeByIdRef.current = null;
      widthScaleRef.current = null;
      return;
    }

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
    svgRef,
  ]);

  useClassicSelectionStyles({
    linkSelectionRef,
    nodeSelectionRef,
    labelSelectionRef,
    widthScaleRef,
    zoomLabelSetRef,
    nodeRadiusRef,
    hoveredCell,
    hoveredNodeId,
    selectedLinkIds,
    getNodeColor,
    hoverNodeColor: HOVER_NODE_COLOR,
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
    hoveredCell,
    hoveredNodeId,
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
