import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { RefObject } from "react";
import { renderCircularScene } from "@/components/circular/circularSceneRenderer";
import type { CircularLink, CircularNode } from "@/types/nodelink";

type UseCircularSceneArgs = {
  svgRefProp?: RefObject<SVGSVGElement | null>;
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
  valueLabel: string;
};

export const useCircularScene = ({
  svgRefProp,
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
  const nodeRadiusRef = useRef<number>(3);
  const zoomLabelSetRef = useRef<Set<string> | null>(null);

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
    });

    if (!scene) {
      linkSelectionRef.current = null;
      nodeSelectionRef.current = null;
      labelSelectionRef.current = null;
      widthScaleRef.current = null;
      return;
    }

    linkSelectionRef.current = scene.linkSelection;
    nodeSelectionRef.current = scene.nodeSelection;
    labelSelectionRef.current = scene.labelSelection;
    widthScaleRef.current = scene.widthScale;
    nodeRadiusRef.current = scene.nodeRadius;
    zoomLabelSetRef.current = scene.zoomLabelSet;
  }, [
    svgRef,
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
  ]);

  return {
    wrapperRef,
    svgRef,
    tooltipRef,
    zoomTransformRef,
    localHoverActive,
    linkSelectionRef,
    nodeSelectionRef,
    labelSelectionRef,
    widthScaleRef,
    nodeRadiusRef,
    zoomLabelSetRef,
  };
};
