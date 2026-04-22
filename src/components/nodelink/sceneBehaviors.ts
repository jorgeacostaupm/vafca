import * as d3 from "d3";
import type { MutableRefObject } from "react";
import {
  NODELINK_TOOLTIP_OFFSET,
} from "@/components/nodelink/nodelinkShared";
import { positionTooltipForPointer } from "@/components/nodelink/tooltipPosition";
import type { ClassicNode } from "@/types/nodelink";

type TooltipHandlersArgs = {
  wrapperEl: HTMLDivElement | null;
  tooltipEl: HTMLDivElement | null;
  setLocalHoverActive: (value: boolean) => void;
};

export const createClassicTooltipHandlers = ({
  wrapperEl,
  tooltipEl,
  setLocalHoverActive,
}: TooltipHandlersArgs) => {
  const showTooltip = (html: string, event: MouseEvent | PointerEvent) => {
    if (!tooltipEl || !wrapperEl) {
      return;
    }
    tooltipEl.innerHTML = html;
    tooltipEl.style.opacity = "1";
    setLocalHoverActive(true);

    const wrapperRect = wrapperEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const { left, top } = positionTooltipForPointer({
      event,
      wrapperRect,
      tooltipRect,
      offset: NODELINK_TOOLTIP_OFFSET,
    });

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  };

  const moveTooltip = (event: MouseEvent | PointerEvent) => {
    if (!tooltipEl || !wrapperEl || tooltipEl.style.opacity !== "1") {
      return;
    }
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const { left, top } = positionTooltipForPointer({
      event,
      wrapperRect,
      tooltipRect,
      offset: NODELINK_TOOLTIP_OFFSET,
    });

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  };

  const hideTooltip = () => {
    if (!tooltipEl) {
      return;
    }
    tooltipEl.style.opacity = "0";
    setLocalHoverActive(false);
  };

  return { showTooltip, moveTooltip, hideTooltip };
};

type ConfigureClassicZoomArgs = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  zoomRoot: d3.Selection<SVGGElement, unknown, null, undefined>;
  geometricZoomEnabled: boolean;
  brushEnabled: boolean;
  zoomTransformRef: MutableRefObject<d3.ZoomTransform>;
};

export const configureClassicZoom = ({
  svg,
  zoomRoot,
  geometricZoomEnabled,
  brushEnabled,
  zoomTransformRef,
}: ConfigureClassicZoomArgs) => {
  if (!geometricZoomEnabled) {
    zoomTransformRef.current = d3.zoomIdentity;
    zoomRoot.attr("transform", d3.zoomIdentity.toString());
    svg.on(".zoom", null);
    svg.style("cursor", "default");
    return;
  }

  const zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.6, 6])
    .filter((event: { type: string; button?: number }) => {
      if (!brushEnabled) {
        return !event.button;
      }
      return event.type === "wheel";
    })
    .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      zoomTransformRef.current = event.transform;
      zoomRoot.attr("transform", event.transform.toString());
    });

  const initialTransform = zoomTransformRef.current ?? d3.zoomIdentity;
  zoomRoot.attr("transform", initialTransform.toString());
  svg.call(zoomBehavior as unknown as d3.ZoomBehavior<SVGSVGElement, unknown>);
  svg.call(zoomBehavior.transform, initialTransform);
  svg.style("cursor", "grab");
};

type ConfigureClassicBrushArgs = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  labels?: string[];
  simNodes: ClassicNode[];
  clampX: (value: number | undefined) => number;
  clampY: (value: number | undefined) => number;
  zoomTransformRef: MutableRefObject<d3.ZoomTransform>;
  onBrushZoom?: (payload: { labels: string[] }) => void;
  hideTooltip: () => void;
};

export const configureClassicBrush = ({
  svg,
  width,
  height,
  labels,
  simNodes,
  clampX,
  clampY,
  zoomTransformRef,
  onBrushZoom,
  hideTooltip,
}: ConfigureClassicBrushArgs) => {
  const brushLayer = svg.append("g").attr("class", "node-link-brush");
  const brush = d3
    .brush()
    .extent([
      [0, 0],
      [width, height],
    ])
    .on("end", (event: d3.D3BrushEvent<unknown>) => {
      const selection = event.selection as [[number, number], [number, number]] | null;
      if (!selection) {
        return;
      }

      hideTooltip();
      const [[x0, y0], [x1, y1]] = selection;
      const transform = zoomTransformRef.current ?? d3.zoomIdentity;
      const [minX, minY] = transform.invert([Math.min(x0, x1), Math.min(y0, y1)]);
      const [maxX, maxY] = transform.invert([Math.max(x0, x1), Math.max(y0, y1)]);

      const selectedIds: string[] = [];
      simNodes.forEach((node) => {
        const x = clampX(node.x);
        const y = clampY(node.y);
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          selectedIds.push(node.labelId ?? String(node.id));
        }
      });

      const selectedSet = new Set(selectedIds);
      const orderedSelection =
        labels && labels.length > 0
          ? labels.filter((label) => selectedSet.has(label))
          : selectedIds;

      if (orderedSelection.length > 0) {
        onBrushZoom?.({ labels: orderedSelection });
      }

      brushLayer.call(brush.move, null);
    });

  brushLayer.call(brush as unknown as d3.BrushBehavior<unknown>);
};
