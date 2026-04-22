import { type MutableRefObject } from "react";
import * as d3 from "d3";
import { renderColumnLabels, renderRowLabels } from "@/components/matrix/heatmap/matrixHeatmapLabels";
import { renderHeatmapCells } from "@/components/matrix/heatmap/matrixHeatmapCells";
import { renderHeatmapBrush } from "@/components/matrix/heatmap/matrixHeatmapBrush";
import {
  createHeatmapColorResolver,
  renderHeatmapLegend,
} from "@/components/matrix/heatmap/matrixHeatmapLegend";
import { createHighlightLayer } from "@/components/matrix/heatmap/matrixHeatmapOverlays";
import { HIGHLIGHT_COLOR } from "@/components/matrix/heatmap/matrixHeatmapConstants";
import type { HeatmapLayout } from "@/components/matrix/heatmap/matrixHeatmapLayout";
import type {
  HeatmapHighlightSelections,
  HeatmapLegendRange,
} from "@/components/matrix/heatmap/matrixHeatmapTypes";
import type { HeatmapProps } from "@/types/matrixHeatmap";

type RenderHeatmapSceneArgs = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  layout: HeatmapLayout;
  data: number[][];
  legendRange: HeatmapLegendRange;
  title?: string;
  valueLabel: string;
  resolvedRowLabels?: string[];
  resolvedColLabels?: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  labelColors?: Record<string, string>;
  selectedZoomLabels?: string[];
  brushEnabled: boolean;
  hoverCbRef: MutableRefObject<HeatmapProps["onCellHover"] | undefined>;
  leaveCbRef: MutableRefObject<HeatmapProps["onCellLeave"] | undefined>;
  selectCbRef: MutableRefObject<HeatmapProps["onCellSelect"] | undefined>;
  brushCbRef: MutableRefObject<HeatmapProps["onBrushZoom"] | undefined>;
  labelToggleCbRef: MutableRefObject<HeatmapProps["onLabelToggle"] | undefined>;
  positionTooltipForCell: (
    colX: number,
    rowY: number,
    bandwidthX: number,
    bandwidthY: number,
  ) => void;
  positionTooltipForPointer: (clientX: number, clientY: number) => void;
};

type RenderHeatmapSceneResult = {
  selectedLayer: d3.Selection<SVGGElement, unknown, null, undefined>;
  highlights: HeatmapHighlightSelections;
};

const renderTitle = (args: {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  title?: string;
}) => {
  const { root, title } = args;
  if (!title) return;

  root
    .append("text")
    .attr("x", 0)
    .attr("y", -8)
    .attr("font-size", 12)
    .attr("font-weight", 600)
    .attr("fill", "#1b2b38")
    .text(title);
};

const applyHighlightColor = (highlights: HeatmapHighlightSelections) => {
  highlights.cell.attr("stroke", HIGHLIGHT_COLOR);
  highlights.rowTop.attr("stroke", HIGHLIGHT_COLOR);
  highlights.rowBottom.attr("stroke", HIGHLIGHT_COLOR);
  highlights.colLeft.attr("stroke", HIGHLIGHT_COLOR);
  highlights.colRight.attr("stroke", HIGHLIGHT_COLOR);
};

export const renderHeatmapScene = ({
  svg,
  tooltip,
  layout,
  data,
  legendRange,
  title,
  valueLabel,
  resolvedRowLabels,
  resolvedColLabels,
  labelNames,
  labelTitles,
  labelAcronyms,
  labelColors,
  selectedZoomLabels,
  brushEnabled,
  hoverCbRef,
  leaveCbRef,
  selectCbRef,
  brushCbRef,
  labelToggleCbRef,
  positionTooltipForCell,
  positionTooltipForPointer,
}: RenderHeatmapSceneArgs): RenderHeatmapSceneResult => {
  const rows = data.length;
  const cols = rows > 0 ? (data[0]?.length ?? 0) : 0;

  const colorResolver = createHeatmapColorResolver(legendRange);

  const root = svg
    .append("g")
    .attr("transform", `translate(${layout.margin.left}, ${layout.margin.top})`);

  renderTitle({ root, title });

  const highlights = createHighlightLayer({ root });

  renderHeatmapCells({
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
    hoverCbRef,
    leaveCbRef,
    selectCbRef,
    positionTooltipForCell,
  });

  if (resolvedColLabels) {
    renderColumnLabels({
      root,
      tooltip,
      labels: resolvedColLabels,
      xScale: layout.xScale,
      colLabelFontSize: layout.colLabelFontSize,
      labelNames,
      labelTitles,
      labelAcronyms,
      labelColors,
      selectedZoomLabels,
      labelToggleCbRef,
      positionTooltipForPointer,
    });
  }

  if (resolvedRowLabels) {
    renderRowLabels({
      root,
      tooltip,
      labels: resolvedRowLabels,
      yScale: layout.yScale,
      rowLabelFontSize: layout.rowLabelFontSize,
      labelNames,
      labelTitles,
      labelAcronyms,
      labelColors,
      selectedZoomLabels,
      labelToggleCbRef,
      positionTooltipForPointer,
    });
  }

  renderHeatmapLegend({
    svg,
    root,
    size: layout.size,
    legendRange,
    colorResolver,
  });

  if (brushEnabled) {
    renderHeatmapBrush({
      root,
      size: layout.size,
      rows,
      cols,
      xScale: layout.xScale,
      yScale: layout.yScale,
      resolvedRowLabels,
      resolvedColLabels,
      brushCbRef,
    });
  }

  const selectedLayer = root.append("g").attr("class", "heatmap-selected");

  root.selectAll(".heatmap-highlight").raise();
  applyHighlightColor(highlights);

  return {
    selectedLayer,
    highlights,
  };
};
