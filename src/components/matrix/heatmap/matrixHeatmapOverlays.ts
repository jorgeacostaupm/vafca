import * as d3 from "d3";
import {
  HIGHLIGHT_GAP,
  SELECTED_COLOR,
  SELECTED_STROKE,
} from "@/components/matrix/heatmap/matrixHeatmapConstants";
import { formatHeatmapTooltipHtml } from "@/components/matrix/matrixHeatmapTooltip";
import type { HeatmapHighlightSelections } from "@/components/matrix/heatmap/matrixHeatmapTypes";

const hideHighlight = (highlights: HeatmapHighlightSelections) => {
  highlights.rowTop.attr("visibility", "hidden");
  highlights.rowBottom.attr("visibility", "hidden");
  highlights.colLeft.attr("visibility", "hidden");
  highlights.colRight.attr("visibility", "hidden");
  highlights.cell.attr("visibility", "hidden");
};

const showHighlight = (args: {
  highlights: HeatmapHighlightSelections;
  colX: number;
  rowY: number;
  bandwidthX: number;
  bandwidthY: number;
  size: number;
}) => {
  const { highlights, colX, rowY, bandwidthX, bandwidthY, size } = args;

  highlights.cell
    .attr("x", colX)
    .attr("y", rowY)
    .attr("width", bandwidthX)
    .attr("height", bandwidthY)
    .attr("visibility", "visible");

  highlights.rowTop
    .attr("x1", 0)
    .attr("x2", size)
    .attr("y1", rowY - HIGHLIGHT_GAP)
    .attr("y2", rowY - HIGHLIGHT_GAP)
    .attr("visibility", "visible");

  highlights.rowBottom
    .attr("x1", 0)
    .attr("x2", size)
    .attr("y1", rowY + bandwidthY + HIGHLIGHT_GAP)
    .attr("y2", rowY + bandwidthY + HIGHLIGHT_GAP)
    .attr("visibility", "visible");

  highlights.colLeft
    .attr("y1", 0)
    .attr("y2", size)
    .attr("x1", colX - HIGHLIGHT_GAP)
    .attr("x2", colX - HIGHLIGHT_GAP)
    .attr("visibility", "visible");

  highlights.colRight
    .attr("y1", 0)
    .attr("y2", size)
    .attr("x1", colX + bandwidthX + HIGHLIGHT_GAP)
    .attr("x2", colX + bandwidthX + HIGHLIGHT_GAP)
    .attr("visibility", "visible");
};

export const updateSelectedCellsOverlay = (args: {
  selectedLayer: d3.Selection<SVGGElement, unknown, null, undefined>;
  xScale: d3.ScaleBand<number>;
  yScale: d3.ScaleBand<number>;
  dataShape: { rows: number; cols: number };
  selectedCells?: Array<{ row: number; col: number }>;
}) => {
  const { selectedLayer, xScale, yScale, dataShape, selectedCells } = args;
  const { rows, cols } = dataShape;

  const inset = 0.6;
  const width = Math.max(xScale.bandwidth() - inset * 2, 0);
  const height = Math.max(yScale.bandwidth() - inset * 2, 0);

  const points =
    selectedCells?.filter(
      (cell) =>
        Number.isFinite(cell.row) &&
        Number.isFinite(cell.col) &&
        cell.row >= 0 &&
        cell.col >= 0 &&
        cell.row < rows &&
        cell.col < cols,
    ) ?? [];

  selectedLayer
    .selectAll<SVGRectElement, { row: number; col: number }>("rect")
    .data(points, (point) => `${point.row}:${point.col}`)
    .join(
      (enter) => enter.append("rect"),
      (update) => update,
      (exit) => exit.remove(),
    )
    .attr("x", (point) => (xScale(point.col) ?? 0) + inset)
    .attr("y", (point) => (yScale(point.row) ?? 0) + inset)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("stroke", SELECTED_COLOR)
    .attr("stroke-width", SELECTED_STROKE)
    .attr("pointer-events", "none");
};

export const syncHoveredCellOverlay = (args: {
  hoveredCell?: { rowId: string; colId: string } | null;
  rowLabels?: string[];
  colLabels?: string[];
  labelNames?: Record<string, string>;
  normalizedData: number[][];
  xScale: d3.ScaleBand<number>;
  yScale: d3.ScaleBand<number>;
  size: number;
  highlights: HeatmapHighlightSelections;
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  valueLabel: string;
  positionTooltipForCell: (
    colX: number,
    rowY: number,
    bandwidthX: number,
    bandwidthY: number,
  ) => void;
}) => {
  const {
    hoveredCell,
    rowLabels,
    colLabels,
    labelNames,
    normalizedData,
    xScale,
    yScale,
    size,
    highlights,
    tooltip,
    valueLabel,
    positionTooltipForCell,
  } = args;

  if (!hoveredCell || !rowLabels || !colLabels) {
    tooltip.style("opacity", "0");
    hideHighlight(highlights);
    return;
  }

  const rowIndex = rowLabels.indexOf(hoveredCell.rowId);
  const colIndex = colLabels.indexOf(hoveredCell.colId);

  if (rowIndex === -1 || colIndex === -1) {
    tooltip.style("opacity", "0");
    hideHighlight(highlights);
    return;
  }

  const rowY = yScale(rowIndex) ?? 0;
  const colX = xScale(colIndex) ?? 0;
  const bandwidthX = xScale.bandwidth();
  const bandwidthY = yScale.bandwidth();

  showHighlight({
    highlights,
    colX,
    rowY,
    bandwidthX,
    bandwidthY,
    size,
  });

  const rowId = rowLabels[rowIndex] ?? String(rowIndex);
  const colId = colLabels[colIndex] ?? String(colIndex);
  const rowLabel = labelNames?.[rowId] ?? rowId;
  const colLabel = labelNames?.[colId] ?? colId;
  const value = normalizedData[rowIndex]?.[colIndex] ?? Number.NaN;

  if (!Number.isFinite(value)) {
    tooltip.style("opacity", "0");
    hideHighlight(highlights);
    return;
  }

  tooltip
    .style("opacity", "1")
    .html(formatHeatmapTooltipHtml(rowLabel, colLabel, value, valueLabel));

  positionTooltipForCell(colX, rowY, bandwidthX, bandwidthY);
};

export const createHighlightLayer = (args: {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
}) => {
  const { root } = args;

  const highlightLayer = root.append("g").attr("class", "heatmap-highlight");

  const cell = highlightLayer
    .append("rect")
    .attr("fill", "none")
    .attr("stroke", "#f0b429")
    .attr("stroke-width", 2)
    .attr("visibility", "hidden");

  const rowTop = highlightLayer
    .append("line")
    .attr("stroke", "#f0b429")
    .attr("stroke-width", 1.6)
    .attr("visibility", "hidden");

  const rowBottom = highlightLayer
    .append("line")
    .attr("stroke", "#f0b429")
    .attr("stroke-width", 1.6)
    .attr("visibility", "hidden");

  const colLeft = highlightLayer
    .append("line")
    .attr("stroke", "#f0b429")
    .attr("stroke-width", 1.6)
    .attr("visibility", "hidden");

  const colRight = highlightLayer
    .append("line")
    .attr("stroke", "#f0b429")
    .attr("stroke-width", 1.6)
    .attr("visibility", "hidden");

  return {
    cell,
    rowTop,
    rowBottom,
    colLeft,
    colRight,
  };
};

export const hideHoveredCellOverlay = (args: {
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  highlights: HeatmapHighlightSelections;
}) => {
  const { tooltip, highlights } = args;
  tooltip.style("opacity", "0");
  hideHighlight(highlights);
};

export const showHoveredCellOverlay = (args: {
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  highlights: HeatmapHighlightSelections;
  rowY: number;
  colX: number;
  bandwidthY: number;
  bandwidthX: number;
  size: number;
}) => {
  const { tooltip, highlights, rowY, colX, bandwidthY, bandwidthX, size } = args;
  tooltip.style("opacity", "1");
  showHighlight({
    highlights,
    colX,
    rowY,
    bandwidthX,
    bandwidthY,
    size,
  });
};
