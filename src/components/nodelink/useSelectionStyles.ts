import * as d3 from "d3";
import type { MutableRefObject } from "react";
import { useEffect } from "react";

import {
  type SharedHoverState,
  subscribeSharedHover,
} from "@/components/hover/sharedHover";
import { DEFAULT_NODE_RADIUS } from "@/components/nodelink/sceneModel";
import { applyClassicHoverSelectionStyles } from "@/components/nodelink/visualEffects";
import { SHARED_HOVER_GRAPH_SYNC_THROTTLE_MS } from "@/config/ui";
import type {
  ClassicLink,
  ClassicNode,
  NetworkLinkColorResolver,
} from "@/types/nodelink";
import type { MatrixVisualStyle } from "@/types/visualizationUi";

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
  selectedLinkIds: Set<string>;
  visualStyle: MatrixVisualStyle;
  linkColorResolver: NetworkLinkColorResolver;
  getNodeColor: (node: ClassicNode) => string;
};

const getHoverCell = (hoverState: SharedHoverState) =>
  hoverState?.type === "cell"
    ? { rowId: hoverState.rowId, colId: hoverState.colId }
    : null;

const getHoverNodeId = (hoverState: SharedHoverState) =>
  hoverState?.type === "node" ? hoverState.nodeId : null;

export const useClassicSelectionStyles = ({
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
}: UseClassicSelectionStylesArgs) => {
  useEffect(() => {
    const linkSelection = linkSelectionRef.current;
    const nodeSelection = nodeSelectionRef.current;
    const labelSelection = labelSelectionRef.current;
    const widthScale = widthScaleRef.current;

    if (!linkSelection || !nodeSelection || !labelSelection || !widthScale) return;

    const applyHover = (hoverState: SharedHoverState) => applyClassicHoverSelectionStyles({
      linkSelection,
      nodeSelection,
      labelSelection,
      widthScale,
      zoomLabelSet: zoomLabelSetRef.current,
      nodeRadius: nodeRadiusRef.current ?? DEFAULT_NODE_RADIUS,
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
  ]);
};
