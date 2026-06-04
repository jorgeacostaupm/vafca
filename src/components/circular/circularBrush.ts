import * as d3 from "d3";
import type { MutableRefObject } from "react";

import { CIRCULAR_BRUSH_LINK_SAMPLE_COUNT } from "@/config/ui";
import type { MatrixBrushMode } from "@/types/matrixHeatmap";
import type { CircularLink, NodeLinkBrushLink } from "@/types/nodelink";

type CircularLinkPathSelection = d3.Selection<
  SVGPathElement,
  CircularLink,
  SVGGElement,
  unknown
>;

type BrushBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type ApplyCircularBrushBehaviorArgs = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  labels?: string[];
  labelNames?: Record<string, string>;
  linkSelection: CircularLinkPathSelection;
  brushMode: MatrixBrushMode;
  centerX: number;
  centerY: number;
  onBrushZoom?: (payload: { labels: string[] }) => void;
  onBrushSelectLinks?: (payload: { links: NodeLinkBrushLink[] }) => void;
  onBrushDeselectLinks?: (payload: { links: NodeLinkBrushLink[] }) => void;
  zoomTransformRef: MutableRefObject<d3.ZoomTransform>;
  hideTooltip: () => void;
};

const overlapsBounds = (a: BrushBounds, b: BrushBounds) =>
  a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;

const pointInBounds = (x: number, y: number, bounds: BrushBounds) =>
  x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;

const getPathBounds = (path: SVGPathElement): BrushBounds | null => {
  try {
    const box = path.getBBox();
    return {
      minX: box.x,
      minY: box.y,
      maxX: box.x + box.width,
      maxY: box.y + box.height,
    };
  } catch {
    return null;
  }
};

const pathIntersectsBounds = (path: SVGPathElement, bounds: BrushBounds) => {
  const pathBounds = getPathBounds(path);
  if (pathBounds && !overlapsBounds(pathBounds, bounds)) return false;

  let totalLength = 0;
  try {
    totalLength = path.getTotalLength();
  } catch {
    return Boolean(pathBounds && overlapsBounds(pathBounds, bounds));
  }

  if (!Number.isFinite(totalLength) || totalLength <= 0) {
    return Boolean(pathBounds && overlapsBounds(pathBounds, bounds));
  }

  for (let step = 0; step <= CIRCULAR_BRUSH_LINK_SAMPLE_COUNT; step += 1) {
    const point = path.getPointAtLength((totalLength * step) / CIRCULAR_BRUSH_LINK_SAMPLE_COUNT);
    if (pointInBounds(point.x, point.y, bounds)) return true;
  }

  return false;
};

const orderSelectedLabels = (selected: Set<string>, labels?: string[]) => {
  if (labels && labels.length > 0) {
    return labels.filter((label) => selected.has(label));
  }
  return Array.from(selected);
};

export const applyCircularBrushBehavior = ({
  svg,
  width,
  height,
  labels,
  labelNames,
  linkSelection,
  brushMode,
  centerX,
  centerY,
  onBrushZoom,
  onBrushSelectLinks,
  onBrushDeselectLinks,
  zoomTransformRef,
  hideTooltip,
}: ApplyCircularBrushBehaviorArgs) => {
  const brushLayer = svg.append("g").attr("class", "node-link-brush");
  const brush = d3
    .brush()
    .extent([
      [0, 0],
      [width, height],
    ])
    .on("end", (event: d3.D3BrushEvent<unknown>) => {
      if (!event.selection) return;
      hideTooltip();

      const [[x0, y0], [x1, y1]] = event.selection as [[number, number], [number, number]];
      const transform = zoomTransformRef.current ?? d3.zoomIdentity;
      const [minX, minY] = transform.invert([Math.min(x0, x1), Math.min(y0, y1)]);
      const [maxX, maxY] = transform.invert([Math.max(x0, x1), Math.max(y0, y1)]);
      const localBounds = {
        minX: minX - centerX,
        minY: minY - centerY,
        maxX: maxX - centerX,
        maxY: maxY - centerY,
      };

      const selectedLabels = new Set<string>();
      const selectedLinks: NodeLinkBrushLink[] = [];
      linkSelection.each(function collectBrushedLinkNodes(link) {
        if (!pathIntersectsBounds(this, localBounds)) return;
        selectedLabels.add(link.rowId);
        selectedLabels.add(link.colId);
        selectedLinks.push({
          rowId: link.rowId,
          colId: link.colId,
          value: link.value,
          rowLabel: labelNames?.[link.rowId] ?? link.rowId,
          colLabel: labelNames?.[link.colId] ?? link.colId,
        });
      });

      if (brushMode === "selectLinks") {
        if (selectedLinks.length > 0) onBrushSelectLinks?.({ links: selectedLinks });
      } else if (brushMode === "deselectLinks") {
        if (selectedLinks.length > 0) onBrushDeselectLinks?.({ links: selectedLinks });
      } else {
        const orderedSelection = orderSelectedLabels(selectedLabels, labels);
        if (orderedSelection.length > 0) {
          onBrushZoom?.({ labels: orderedSelection });
        }
      }

      brushLayer.call(brush.move, null);
    });

  brushLayer.call(brush as unknown as d3.BrushBehavior<unknown>);
};
