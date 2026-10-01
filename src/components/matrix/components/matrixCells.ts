import * as d3 from "d3";
import { type MutableRefObject } from "react";

import type { TooltipValueLabel } from "@/components/common/tooltipValueLabel";
import { buildHeatmapCells } from "@/components/matrix/components/matrixData";
import type { HeatmapLayout } from "@/components/matrix/components/matrixLayout";
import {
  hideHoveredCellOverlay,
  showHoveredCellOverlay,
} from "@/components/matrix/components/matrixOverlays";
import type { HeatmapHighlightSelections } from "@/components/matrix/components/matrixTypes";
import {
  formatHeatmapTooltipHtml,
  resolveHeatmapTooltipLabel,
} from "@/components/matrix/matrixTooltip";
import type { HeatmapProps } from "@/types/matrixHeatmap";

type HoverPayload = Parameters<NonNullable<HeatmapProps["onCellHover"]>>[0];

const buildCellHoverPayload = (args: {
  row: number;
  col: number;
  value: number;
  resolvedRowLabels?: string[];
  resolvedColLabels?: string[];
  labelNames?: Record<string, string>;
}): HoverPayload => {
  const { row, col, value, resolvedRowLabels, resolvedColLabels, labelNames } = args;
  const rowId = resolvedRowLabels?.[row] ?? String(row);
  const colId = resolvedColLabels?.[col] ?? String(col);
  const rowLabel = labelNames?.[rowId] ?? rowId;
  const colLabel = labelNames?.[colId] ?? colId;

  return {
    row,
    col,
    value,
    rowId,
    colId,
    rowLabel,
    colLabel,
  };
};

export const renderHeatmapCells = (args: {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  layout: HeatmapLayout;
  data: number[][];
  valueLabel: TooltipValueLabel;
  colorResolver: (value: number) => string;
  highlights: HeatmapHighlightSelections;
  resolvedRowLabels?: string[];
  resolvedColLabels?: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  hoverCbRef: MutableRefObject<HeatmapProps["onCellHover"] | undefined>;
  leaveCbRef: MutableRefObject<HeatmapProps["onCellLeave"] | undefined>;
  selectCbRef: MutableRefObject<HeatmapProps["onCellSelect"] | undefined>;
  positionTooltipForCell: (
    colX: number,
    rowY: number,
    bandwidthX: number,
    bandwidthY: number,
  ) => void;
}) => {
  const {
    root,
    tooltip,
    layout,
    data,
    valueLabel,
    colorResolver,
    highlights,
    resolvedRowLabels,
    resolvedColLabels,
    labelNames,
    labelTitles,
    hoverCbRef,
    leaveCbRef,
    selectCbRef,
    positionTooltipForCell,
  } = args;

  const cells = buildHeatmapCells(data);
  const cellsLayer = root.append("g");

  cellsLayer
    .selectAll("rect")
    .data(cells)
    .join("rect")
    .attr("x", (cell) => layout.xScale(cell.col) ?? 0)
    .attr("y", (cell) => layout.yScale(cell.row) ?? 0)
    .attr("width", layout.xScale.bandwidth())
    .attr("height", layout.yScale.bandwidth())
    .attr("fill", (cell) =>
      Number.isFinite(cell.value) ? colorResolver(cell.value) : "transparent",
    )
    .attr("opacity", (cell) =>
      Number.isFinite(cell.value) ? (cell.value === 0 ? 0.12 : 1) : 0,
    )
    .attr("pointer-events", (cell) =>
      Number.isFinite(cell.value) ? "all" : "none",
    )
    .on("mouseenter", (_event, cell) => {
      const rowY = layout.yScale(cell.row) ?? 0;
      const colX = layout.xScale(cell.col) ?? 0;
      const bandwidthX = layout.xScale.bandwidth();
      const bandwidthY = layout.yScale.bandwidth();

      showHoveredCellOverlay({
        tooltip,
        highlights,
        rowY,
        colX,
        bandwidthY,
        bandwidthX,
        size: layout.size,
      });

      const payload = buildCellHoverPayload({
        row: cell.row,
        col: cell.col,
        value: cell.value,
        resolvedRowLabels,
        resolvedColLabels,
        labelNames,
      });

      hoverCbRef.current?.(payload);
      tooltip
        .html(
          formatHeatmapTooltipHtml(
            resolveHeatmapTooltipLabel(payload.rowId, labelNames, labelTitles),
            resolveHeatmapTooltipLabel(payload.colId, labelNames, labelTitles),
            cell.value,
            valueLabel,
            payload.rowId,
            payload.colId,
          ),
        )
        .style("opacity", "1");

      positionTooltipForCell(colX, rowY, bandwidthX, bandwidthY);
    })
    .on("click", (_event, cell) => {
      const payload = buildCellHoverPayload({
        row: cell.row,
        col: cell.col,
        value: cell.value,
        resolvedRowLabels,
        resolvedColLabels,
        labelNames,
      });
      selectCbRef.current?.(payload);
    })
    .on("mouseleave", () => {
      hideHoveredCellOverlay({ tooltip, highlights });
      leaveCbRef.current?.();
    });
};
