import * as d3 from "d3";
import type { MutableRefObject, RefObject } from "react";
import { useEffect } from "react";

import {
  type SharedHoverState,
  subscribeSharedHover,
} from "@/components/hover/sharedHover";
import { DEFAULT_MARGIN } from "@/components/nodelink/sceneModel";
import { positionTooltipForCoordinates } from "@/components/nodelink/tooltipPosition";
import { syncClassicProgrammaticTooltip } from "@/components/nodelink/visualEffects";
import {
  NODELINK_TOOLTIP_OFFSET,
  SHARED_HOVER_GRAPH_SYNC_THROTTLE_MS,
} from "@/config/ui";
import type { ClassicLink, ClassicNode } from "@/types/nodelink";

type UseClassicProgrammaticTooltipArgs = {
  tooltipRef: RefObject<HTMLDivElement | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
  localHoverActiveRef: MutableRefObject<boolean>;
  hoverSyncRevision: number;
  width: number;
  height: number;
  nodesRef: MutableRefObject<ClassicNode[] | null>;
  linksRef: MutableRefObject<ClassicLink[] | null>;
  degreeByIdRef: MutableRefObject<Map<string, number> | null>;
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  valueLabel: string;
  zoomTransformRef: MutableRefObject<d3.ZoomTransform>;
};

export const useClassicProgrammaticTooltip = ({
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
}: UseClassicProgrammaticTooltipArgs) => {
  useEffect(() => {
    const tooltipEl = tooltipRef.current;
    const wrapperEl = wrapperRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;
    const degreeById = degreeByIdRef.current;

    if (!tooltipEl || !wrapperEl) return;

    const syncTooltip = (hoverState: SharedHoverState) => {
      if (localHoverActiveRef.current) return;
      if (width <= 0 || height <= 0 || !nodes || !links || !degreeById) {
        tooltipEl.style.opacity = "0";
        return;
      }

      const positionTooltip = (x: number, y: number, wrapperRect: DOMRect) => {
        const tooltipRect = tooltipEl.getBoundingClientRect();
        const { left, top } = positionTooltipForCoordinates({
          x,
          y,
          wrapperRect,
          tooltipRect,
          offset: NODELINK_TOOLTIP_OFFSET,
        });

        tooltipEl.style.left = `${left}px`;
        tooltipEl.style.top = `${top}px`;
      };

      syncClassicProgrammaticTooltip({
        tooltipEl,
        wrapperEl,
        nodes,
        links,
        degreeById,
        hoveredCell:
          hoverState?.type === "cell"
            ? { rowId: hoverState.rowId, colId: hoverState.colId }
            : null,
        hoveredNodeId: hoverState?.type === "node" ? hoverState.nodeId : null,
        labelNames,
        labelTitles,
        labelAcronyms,
        valueLabel,
        width,
        height,
        defaultMargin: DEFAULT_MARGIN,
        zoomTransform: zoomTransformRef.current ?? d3.zoomIdentity,
        positionTooltip,
      });
    };

    return subscribeSharedHover(syncTooltip, {
      throttleMs: SHARED_HOVER_GRAPH_SYNC_THROTTLE_MS,
    });
  }, [
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
  ]);
};
