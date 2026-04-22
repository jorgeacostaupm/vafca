import { useEffect } from "react";
import * as d3 from "d3";
import type { MutableRefObject } from "react";
import { DEFAULT_NODE_RADIUS } from "@/components/nodelink/sceneModel";
import { applyClassicHoverSelectionStyles } from "@/components/nodelink/visualEffects";
import type { ClassicLink, ClassicNode } from "@/types/nodelink";

type UseClassicSelectionStylesArgs = {
  linkSelectionRef: MutableRefObject<
    d3.Selection<SVGLineElement, ClassicLink, SVGGElement, unknown> | null
  >;
  nodeSelectionRef: MutableRefObject<
    d3.Selection<SVGCircleElement, ClassicNode, SVGGElement, unknown> | null
  >;
  labelSelectionRef: MutableRefObject<
    d3.Selection<SVGTextElement, ClassicNode, SVGGElement, unknown> | null
  >;
  widthScaleRef: MutableRefObject<d3.ScaleLinear<number, number> | null>;
  zoomLabelSetRef: MutableRefObject<Set<string> | null>;
  nodeRadiusRef: MutableRefObject<number>;
  hoveredCell?: { rowId: string; colId: string } | null;
  hoveredNodeId?: string | null;
  selectedLinkIds: Set<string>;
  getNodeColor: (node: ClassicNode) => string;
  hoverNodeColor: string;
};

export const useClassicSelectionStyles = ({
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
  hoverNodeColor,
}: UseClassicSelectionStylesArgs) => {
  useEffect(() => {
    const linkSelection = linkSelectionRef.current;
    const nodeSelection = nodeSelectionRef.current;
    const labelSelection = labelSelectionRef.current;
    const widthScale = widthScaleRef.current;

    if (!linkSelection || !nodeSelection || !labelSelection || !widthScale) {
      return;
    }

    applyClassicHoverSelectionStyles({
      linkSelection,
      nodeSelection,
      labelSelection,
      widthScale,
      zoomLabelSet: zoomLabelSetRef.current,
      nodeRadius: nodeRadiusRef.current ?? DEFAULT_NODE_RADIUS,
      hoveredCell,
      hoveredNodeId,
      selectedLinkIds,
      getNodeColor,
      hoverNodeColor,
    });
  }, [
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
    hoverNodeColor,
  ]);
};
