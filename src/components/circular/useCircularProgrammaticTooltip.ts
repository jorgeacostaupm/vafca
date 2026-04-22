import { useEffect } from "react";
import * as d3 from "d3";
import type { MutableRefObject, RefObject } from "react";
import { NODELINK_TOOLTIP_OFFSET } from "@/components/nodelink/nodelinkShared";
import { positionTooltipForCoordinates } from "@/components/nodelink/tooltipPosition";
import { syncCircularProgrammaticTooltip } from "@/components/circular/circularVisualEffects";
import type { CircularLink, CircularNode } from "@/types/nodelink";

type UseCircularProgrammaticTooltipArgs = {
  tooltipRef: RefObject<HTMLDivElement | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
  localHoverActive: boolean;
  width: number;
  height: number;
  nodes: CircularNode[];
  links: CircularLink[];
  degreeById: Map<string, number>;
  hoveredCell?: { rowId: string; colId: string } | null;
  hoveredNodeId?: string | null;
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  valueLabel: string;
  zoomTransformRef: MutableRefObject<d3.ZoomTransform>;
};

export const useCircularProgrammaticTooltip = ({
  tooltipRef,
  wrapperRef,
  localHoverActive,
  width,
  height,
  nodes,
  links,
  degreeById,
  hoveredCell,
  hoveredNodeId,
  labelNames,
  labelTitles,
  labelAcronyms,
  valueLabel,
  zoomTransformRef,
}: UseCircularProgrammaticTooltipArgs) => {
  useEffect(() => {
    const tooltipEl = tooltipRef.current;
    const wrapperEl = wrapperRef.current;
    if (!tooltipEl || !wrapperEl) return;
    if (localHoverActive) return;

    if (width <= 0 || height <= 0) {
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

    syncCircularProgrammaticTooltip({
      tooltipEl,
      wrapperEl,
      nodes,
      links,
      degreeById,
      hoveredCell,
      hoveredNodeId,
      labelNames,
      labelTitles,
      labelAcronyms,
      valueLabel,
      width,
      height,
      zoomTransform: zoomTransformRef.current ?? d3.zoomIdentity,
      positionTooltip,
    });
  }, [
    tooltipRef,
    wrapperRef,
    localHoverActive,
    width,
    height,
    nodes,
    links,
    degreeById,
    hoveredCell,
    hoveredNodeId,
    labelNames,
    labelTitles,
    labelAcronyms,
    valueLabel,
    zoomTransformRef,
  ]);
};
