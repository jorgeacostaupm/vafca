import * as d3 from "d3";

import {
  HIGHLIGHT_AXIS_STROKE,
  HIGHLIGHT_GAP,
  SELECTED_INSET,
  SELECTED_STROKE,
} from "@/components/matrix/components/matrixConstants";
import type { MatrixSelectionBlock } from "@/components/matrix/components/matrixSelectionBlocks";
import { buildSelectionOverlayBlocks } from "@/components/matrix/components/matrixSelectionBlocks";
import type { HeatmapHighlightSelections } from "@/components/matrix/components/matrixTypes";
import {
  formatHeatmapTooltipHtml,
  resolveHeatmapTooltipLabel,
} from "@/components/matrix/matrixTooltip";
import type { MatrixVisualStyle } from "@/types/visualizationUi";

const hideHighlight = (highlights: HeatmapHighlightSelections) => {
  highlights.rowTop.attr("visibility", "hidden");
  highlights.rowBottom.attr("visibility", "hidden");
  highlights.colLeft.attr("visibility", "hidden");
  highlights.colRight.attr("visibility", "hidden");
};

const showHighlight = (args: {
  highlights: HeatmapHighlightSelections;
  colX?: number;
  rowY?: number;
  bandwidthX?: number;
  bandwidthY?: number;
  size: number;
}) => {
  const {
    highlights,
    colX,
    rowY,
    bandwidthX,
    bandwidthY,
    size,
  } = args;
  const hasRow = rowY !== undefined && bandwidthY !== undefined;
  const hasCol = colX !== undefined && bandwidthX !== undefined;

  if (hasRow) {
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
  } else {
    highlights.rowTop.attr("visibility", "hidden");
    highlights.rowBottom.attr("visibility", "hidden");
  }

  if (hasCol) {
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
  } else {
    highlights.colLeft.attr("visibility", "hidden");
    highlights.colRight.attr("visibility", "hidden");
  }
};

const buildSelectionPath = (args: {
  blocks: MatrixSelectionBlock[];
  xScale: d3.ScaleBand<number>;
  yScale: d3.ScaleBand<number>;
  inset: number;
  width: number;
  height: number;
}) => {
  const { blocks, xScale, yScale, inset, width, height } = args;

  return blocks
    .map((block) => {
      const x = (xScale(block.col) ?? 0) + inset;
      const y = (yScale(block.row) ?? 0) + inset;
      const blockWidth = Math.max(
        width * block.colSpan + inset * 2 * (block.colSpan - 1),
        0,
      );
      const blockHeight = Math.max(
        height * block.rowSpan + inset * 2 * (block.rowSpan - 1),
        0,
      );
      return `M${x},${y}h${blockWidth}v${blockHeight}h${-blockWidth}Z`;
    })
    .join("");
};

export const updateSelectedCellsOverlay = (args: {
  selectedLayer: d3.Selection<SVGGElement, unknown, null, undefined>;
  xScale: d3.ScaleBand<number>;
  yScale: d3.ScaleBand<number>;
  dataShape: { rows: number; cols: number };
  visibleData?: number[][];
  symmetric: boolean;
  selectedCells?: Array<{ row: number; col: number }>;
  visualStyle: MatrixVisualStyle;
}) => {
  const {
    selectedLayer,
    xScale,
    yScale,
    dataShape,
    visibleData,
    symmetric,
    selectedCells,
    visualStyle,
  } = args;
  const { rows, cols } = dataShape;

  const inset = SELECTED_INSET;
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

  const blocks = buildSelectionOverlayBlocks({
    cells: points,
    visibleData,
    symmetric,
  });
  const path = buildSelectionPath({
    blocks,
    xScale,
    yScale,
    inset,
    width,
    height,
  });

  selectedLayer
    .selectAll<SVGPathElement, string>("path")
    .data(path ? [path] : [])
    .join(
      (enter) => enter.append("path"),
      (update) => update,
      (exit) => exit.remove(),
    )
    .attr("d", (value) => value)
    .attr("fill", "none")
    .attr("stroke", visualStyle.selectionColor)
    .attr("stroke-width", SELECTED_STROKE)
    .attr("pointer-events", "none");
};

export const syncHoveredCellOverlay = (args: {
  hoveredCell?: { rowId: string; colId: string } | null;
  hoveredNodeId?: string | null;
  rowLabels?: string[];
  colLabels?: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
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
    hoveredNodeId,
    rowLabels,
    colLabels,
    labelNames,
    labelTitles,
    normalizedData,
    xScale,
    yScale,
    size,
    highlights,
    tooltip,
    valueLabel,
    positionTooltipForCell,
  } = args;

  if (!rowLabels || !colLabels) {
    tooltip.style("opacity", "0");
    hideHighlight(highlights);
    return;
  }

  if (hoveredNodeId && !hoveredCell) {
    const rowIndex = rowLabels.indexOf(hoveredNodeId);
    const colIndex = colLabels.indexOf(hoveredNodeId);
    if (rowIndex === -1 && colIndex === -1) {
      tooltip.style("opacity", "0");
      hideHighlight(highlights);
      return;
    }

    tooltip.style("opacity", "0");
    showHighlight({
      highlights,
      rowY: rowIndex >= 0 ? yScale(rowIndex) : undefined,
      colX: colIndex >= 0 ? xScale(colIndex) : undefined,
      bandwidthX: colIndex >= 0 ? xScale.bandwidth() : undefined,
      bandwidthY: rowIndex >= 0 ? yScale.bandwidth() : undefined,
      size,
    });
    return;
  }

  if (!hoveredCell) {
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
  const rowLabel = resolveHeatmapTooltipLabel(rowId, labelNames, labelTitles);
  const colLabel = resolveHeatmapTooltipLabel(colId, labelNames, labelTitles);
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
  visualStyle: MatrixVisualStyle;
}) => {
  const { root, visualStyle } = args;

  const highlightLayer = root.append("g").attr("class", "heatmap-highlight");

  const rowTop = highlightLayer
    .append("line")
    .attr("stroke", visualStyle.highlightColor)
    .attr("stroke-width", HIGHLIGHT_AXIS_STROKE)
    .attr("visibility", "hidden");

  const rowBottom = highlightLayer
    .append("line")
    .attr("stroke", visualStyle.highlightColor)
    .attr("stroke-width", HIGHLIGHT_AXIS_STROKE)
    .attr("visibility", "hidden");

  const colLeft = highlightLayer
    .append("line")
    .attr("stroke", visualStyle.highlightColor)
    .attr("stroke-width", HIGHLIGHT_AXIS_STROKE)
    .attr("visibility", "hidden");

  const colRight = highlightLayer
    .append("line")
    .attr("stroke", visualStyle.highlightColor)
    .attr("stroke-width", HIGHLIGHT_AXIS_STROKE)
    .attr("visibility", "hidden");

  return {
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
