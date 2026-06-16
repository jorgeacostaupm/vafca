import * as d3 from "d3";
import { type MutableRefObject } from "react";

import { renderHeatmapBrush } from "@/components/matrix/components/matrixBrush";
import { renderHeatmapCells } from "@/components/matrix/components/matrixCells";
import { renderColumnLabels, renderRowLabels } from "@/components/matrix/components/matrixLabels";
import type { HeatmapLayout } from "@/components/matrix/components/matrixLayout";
import {
  createHeatmapColorResolver,
  renderHeatmapLegend,
} from "@/components/matrix/components/matrixLegend";
import { createHighlightLayer } from "@/components/matrix/components/matrixOverlays";
import type {
  HeatmapHighlightSelections,
  HeatmapLegendRange,
} from "@/components/matrix/components/matrixTypes";
import type { HeatmapProps } from "@/types/matrixHeatmap";
import type { ScaleType } from "@/types/network";
import type {
  MatrixColorScaleSettings,
  MatrixVisualStyle,
} from "@/types/visualizationUi";

type RenderHeatmapSceneArgs = {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  layout: HeatmapLayout;
  data: number[][];
  legendRange: HeatmapLegendRange;
  scaleType: ScaleType;
  scaleCenter: number | null;
  colorScaleSettings: MatrixColorScaleSettings;
  visualStyle: MatrixVisualStyle;
  title?: string;
  valueLabel: string;
  resolvedRowLabels?: string[];
  resolvedColLabels?: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelColors?: Record<string, string>;
  selectedZoomLabels?: string[];
  brushEnabled: boolean;
  brushMode: NonNullable<HeatmapProps["brushMode"]>;
  hoverCbRef: MutableRefObject<HeatmapProps["onCellHover"] | undefined>;
  leaveCbRef: MutableRefObject<HeatmapProps["onCellLeave"] | undefined>;
  selectCbRef: MutableRefObject<HeatmapProps["onCellSelect"] | undefined>;
  brushCbRef: MutableRefObject<HeatmapProps["onBrushZoom"] | undefined>;
  brushSelectLinksCbRef: MutableRefObject<
    HeatmapProps["onBrushSelectLinks"] | undefined
  >;
  brushDeselectLinksCbRef: MutableRefObject<
    HeatmapProps["onBrushDeselectLinks"] | undefined
  >;
  labelToggleCbRef: MutableRefObject<HeatmapProps["onLabelToggle"] | undefined>;
  labelHoverCbRef: MutableRefObject<HeatmapProps["onLabelHover"] | undefined>;
  labelLeaveCbRef: MutableRefObject<HeatmapProps["onLabelLeave"] | undefined>;
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

const applyHighlightColor = (
  highlights: HeatmapHighlightSelections,
  visualStyle: MatrixVisualStyle,
) => {
  highlights.rowTop.attr("stroke", visualStyle.highlightColor);
  highlights.rowBottom.attr("stroke", visualStyle.highlightColor);
  highlights.colLeft.attr("stroke", visualStyle.highlightColor);
  highlights.colRight.attr("stroke", visualStyle.highlightColor);
};

export const renderHeatmapScene = ({
  svg,
  tooltip,
  layout,
  data,
  legendRange,
  scaleType,
  scaleCenter,
  colorScaleSettings,
  visualStyle,
  title,
  valueLabel,
  resolvedRowLabels,
  resolvedColLabels,
  labelNames,
  labelTitles,
  labelColors,
  selectedZoomLabels,
  brushEnabled,
  brushMode,
  hoverCbRef,
  leaveCbRef,
  selectCbRef,
  brushCbRef,
  brushSelectLinksCbRef,
  brushDeselectLinksCbRef,
  labelToggleCbRef,
  labelHoverCbRef,
  labelLeaveCbRef,
  positionTooltipForCell,
  positionTooltipForPointer,
}: RenderHeatmapSceneArgs): RenderHeatmapSceneResult => {
  const rows = data.length;
  const cols = rows > 0 ? (data[0]?.length ?? 0) : 0;

  const colorResolver = createHeatmapColorResolver({
    legendRange,
    scaleType,
    scaleCenter,
    colorScaleSettings,
  });

  const root = svg
    .append("g")
    .attr("transform", `translate(${layout.margin.left}, ${layout.margin.top})`);

  renderTitle({ root, title });

  const highlights = createHighlightLayer({ root, visualStyle });

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
    labelTitles,
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
      data,
      xScale: layout.xScale,
      colLabelFontSize: layout.colLabelFontSize,
      labelNames,
      labelTitles,
      labelColors,
      visualStyle,
      selectedZoomLabels,
      labelToggleCbRef,
      labelHoverCbRef,
      labelLeaveCbRef,
      positionTooltipForPointer,
    });
  }

  if (resolvedRowLabels) {
    renderRowLabels({
      root,
      tooltip,
      labels: resolvedRowLabels,
      data,
      yScale: layout.yScale,
      rowLabelFontSize: layout.rowLabelFontSize,
      labelNames,
      labelTitles,
      labelColors,
      visualStyle,
      selectedZoomLabels,
      labelToggleCbRef,
      labelHoverCbRef,
      labelLeaveCbRef,
      positionTooltipForPointer,
    });
  }

  renderHeatmapLegend({
    svg,
    root,
    length: layout.size,
    legendRange,
    colorResolver,
    discreteSteps: colorScaleSettings.discretize
      ? colorScaleSettings.discreteSteps
      : null,
  });

  if (brushEnabled) {
    renderHeatmapBrush({
      root,
      size: layout.size,
      rows,
      cols,
      data,
      xScale: layout.xScale,
      yScale: layout.yScale,
      resolvedRowLabels,
      resolvedColLabels,
      brushCbRef,
      brushSelectLinksCbRef,
      brushDeselectLinksCbRef,
      brushMode,
    });
  }

  const selectedLayer = root.append("g").attr("class", "heatmap-selected");

  root.selectAll(".heatmap-highlight").raise();
  selectedLayer.raise();
  applyHighlightColor(highlights, visualStyle);

  return {
    selectedLayer,
    highlights,
  };
};
