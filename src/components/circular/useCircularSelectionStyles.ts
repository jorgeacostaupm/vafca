import { useEffect } from "react";
import type * as d3 from "d3";
import type { MutableRefObject } from "react";
import { applyCircularHoverSelectionStyles } from "@/components/circular/circularVisualEffects";
import type { CircularLink, CircularNode } from "@/types/nodelink";

type UseCircularSelectionStylesArgs = {
  linkSelectionRef: MutableRefObject<
    d3.Selection<SVGPathElement, CircularLink, SVGGElement, unknown> | null
  >;
  nodeSelectionRef: MutableRefObject<
    d3.Selection<SVGCircleElement, CircularNode, SVGGElement, unknown> | null
  >;
  labelSelectionRef: MutableRefObject<
    d3.Selection<SVGTextElement, CircularNode, SVGGElement, unknown> | null
  >;
  widthScaleRef: MutableRefObject<d3.ScaleLinear<number, number> | null>;
  zoomLabelSetRef: MutableRefObject<Set<string> | null>;
  nodeRadiusRef: MutableRefObject<number>;
  hoveredCell?: { rowId: string; colId: string } | null;
  hoveredNodeId?: string | null;
  selectedLinkIds: Set<string>;
  getNodeColor: (node: CircularNode) => string;
  selectedColor: string;
};

export const useCircularSelectionStyles = ({
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
  selectedColor,
}: UseCircularSelectionStylesArgs) => {
  useEffect(() => {
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
      nodeRadius: nodeRadiusRef.current ?? 3,
      hoveredCell,
      hoveredNodeId,
      selectedLinkIds,
      getNodeColor,
      selectedColor,
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
    selectedColor,
  ]);
};
