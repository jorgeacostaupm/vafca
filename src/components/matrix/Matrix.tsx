import * as d3 from "d3";
import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  type SharedHoverState,
  subscribeSharedHover,
} from "@/components/hover/sharedHover";
import { BASE_MARGIN } from "@/components/matrix/components/matrixConstants";
import {
  applyHeatmapValueFilters,
  buildNormalizedMatrix,
  computeHeatmapFiniteBounds,
  resolveHeatmapAxisLabels,
  resolveHeatmapLegendRange,
} from "@/components/matrix/components/matrixData";
import { buildHeatmapLayout } from "@/components/matrix/components/matrixLayout";
import {
  syncHoveredCellOverlay,
  updateSelectedCellsOverlay,
} from "@/components/matrix/components/matrixOverlays";
import { renderHeatmapScene } from "@/components/matrix/components/matrixScene";
import type {
  HeatmapHighlightSelections,
  MatrixMargin,
} from "@/components/matrix/components/matrixTypes";
import {
  getTooltipPositionForMatrixCell,
  getTooltipPositionForMatrixPointer,
} from "@/components/matrix/matrixTooltip";
import {
  DEFAULT_MATRIX_COLOR_SETTINGS,
  getMatrixVisualStyle,
} from "@/config/matrixColorScales";
import type { HeatmapProps } from "@/types/matrixHeatmap";

function MatrixHeatmap({
  data,
  width,
  height,
  title,
  valueLabel = "Value",
  symmetric = false,
  labels,
  rowLabels,
  colLabels,
  labelNames,
  labelTitles,
  labelColors,
  brushEnabled = false,
  brushMode = "zoom",
  showAllLabels = false,
  selectedZoomLabels,
  legendMin,
  legendMax,
  scaleType,
  scaleCenter,
  colorScaleSettings,
  visualStyle,
  valueFilters,
  selectedCells,
  svgRef: svgRefProp,
  onCellHover,
  onCellLeave,
  onLabelHover,
  onLabelLeave,
  onCellSelect,
  onBrushZoom,
  onBrushSelectLinks,
  onBrushDeselectLinks,
  onLabelToggle,
}: HeatmapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const svgRef = svgRefProp ?? internalSvgRef;
  const tooltipRef = useRef<HTMLDivElement>(null);

  const tooltipSelRef = useRef<d3.Selection<
    HTMLDivElement,
    unknown,
    null,
    undefined
  > | null>(null);
  const selectedLayerRef = useRef<d3.Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  > | null>(null);
  const selectedCellsRef = useRef(selectedCells);
  const highlightRefs = useRef<HeatmapHighlightSelections | null>(null);

  const xScaleRef = useRef<d3.ScaleBand<number> | null>(null);
  const yScaleRef = useRef<d3.ScaleBand<number> | null>(null);
  const marginRef = useRef<MatrixMargin>(BASE_MARGIN);
  const sizeRef = useRef(0);
  const rowLabelsRef = useRef<string[] | undefined>(undefined);
  const colLabelsRef = useRef<string[] | undefined>(undefined);
  const normalizedRef = useRef<number[][]>([]);

  const hoverCbRef = useRef(onCellHover);
  const leaveCbRef = useRef(onCellLeave);
  const selectCbRef = useRef(onCellSelect);
  const brushCbRef = useRef(onBrushZoom);
  const brushSelectLinksCbRef = useRef(onBrushSelectLinks);
  const brushDeselectLinksCbRef = useRef(onBrushDeselectLinks);
  const labelToggleCbRef = useRef(onLabelToggle);
  const labelHoverCbRef = useRef(onLabelHover);
  const labelLeaveCbRef = useRef(onLabelLeave);

  const positionTooltipForCell = useCallback(
    (colX: number, rowY: number, bandwidthX: number, bandwidthY: number) => {
      const tooltipEl = tooltipRef.current;
      if (!tooltipEl) return;

      const { left, top } = getTooltipPositionForMatrixCell({
        colX,
        rowY,
        bandwidthX,
        bandwidthY,
        matrixSize: sizeRef.current,
        margin: marginRef.current,
        tooltipRect: tooltipEl.getBoundingClientRect(),
      });

      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.top = `${top}px`;
    },
    [],
  );

  const positionTooltipForPointer = useCallback((clientX: number, clientY: number) => {
    const tooltipEl = tooltipRef.current;
    const wrapperEl = wrapperRef.current;
    if (!tooltipEl || !wrapperEl) return;

    const { left, top } = getTooltipPositionForMatrixPointer({
      clientX,
      clientY,
      wrapperRect: wrapperEl.getBoundingClientRect(),
      tooltipRect: tooltipEl.getBoundingClientRect(),
    });

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  }, []);

  useEffect(() => {
    hoverCbRef.current = onCellHover;
    leaveCbRef.current = onCellLeave;
    selectCbRef.current = onCellSelect;
    brushCbRef.current = onBrushZoom;
    brushSelectLinksCbRef.current = onBrushSelectLinks;
    brushDeselectLinksCbRef.current = onBrushDeselectLinks;
    labelToggleCbRef.current = onLabelToggle;
    labelHoverCbRef.current = onLabelHover;
    labelLeaveCbRef.current = onLabelLeave;
  }, [
    onCellHover,
    onCellLeave,
    onCellSelect,
    onBrushZoom,
    onBrushSelectLinks,
    onBrushDeselectLinks,
    onLabelToggle,
    onLabelHover,
    onLabelLeave,
  ]);

  useEffect(() => {
    selectedCellsRef.current = selectedCells;
  }, [selectedCells]);

  const normalized = useMemo(
    () => buildNormalizedMatrix(data),
    [data],
  );

  const filtered = useMemo(
    () => applyHeatmapValueFilters(normalized, valueFilters),
    [normalized, valueFilters],
  );

  const { min: minValue, max: maxValue } = useMemo(
    () => computeHeatmapFiniteBounds(filtered),
    [filtered],
  );

  const legendRange = useMemo(
    () =>
      resolveHeatmapLegendRange({
        legendMin,
        legendMax,
        minValue,
        maxValue,
      }),
    [legendMin, legendMax, minValue, maxValue],
  );

  const resolvedScaleType = useMemo(
    () =>
      scaleType ??
      (legendRange.min < 0 && legendRange.max > 0 ? "diverging" : "sequential"),
    [legendRange.max, legendRange.min, scaleType],
  );
  const resolvedColorScaleSettings = useMemo(
    () => colorScaleSettings ?? DEFAULT_MATRIX_COLOR_SETTINGS[resolvedScaleType],
    [colorScaleSettings, resolvedScaleType],
  );
  const resolvedVisualStyle = useMemo(
    () => visualStyle ?? getMatrixVisualStyle(resolvedColorScaleSettings),
    [resolvedColorScaleSettings, visualStyle],
  );

  const { resolvedRowLabels, resolvedColLabels } = useMemo(
    () =>
      resolveHeatmapAxisLabels({
        data: filtered,
        labels,
        rowLabels,
        colLabels,
      }),
    [filtered, labels, rowLabels, colLabels],
  );

  const layout = useMemo(
    () =>
      buildHeatmapLayout({
        width,
        height,
        rows: filtered.length,
        cols: filtered[0]?.length ?? 0,
        rowLabels: resolvedRowLabels,
        colLabels: resolvedColLabels,
        labelNames,
      }),
    [width, height, filtered, resolvedRowLabels, resolvedColLabels, labelNames],
  );

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const tooltip = d3.select(tooltipRef.current);
    tooltipSelRef.current = tooltip;

    const { selectedLayer, highlights } = renderHeatmapScene({
      svg,
      tooltip,
      layout,
      data: filtered,
      legendRange,
      scaleType: resolvedScaleType,
      scaleCenter: scaleCenter ?? null,
      colorScaleSettings: resolvedColorScaleSettings,
      visualStyle: resolvedVisualStyle,
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
    });

    selectedLayerRef.current = selectedLayer;
    highlightRefs.current = highlights;

    xScaleRef.current = layout.xScale;
    yScaleRef.current = layout.yScale;
    marginRef.current = layout.margin;
    sizeRef.current = layout.size;
    rowLabelsRef.current = resolvedRowLabels;
    colLabelsRef.current = resolvedColLabels;
    normalizedRef.current = filtered;

    updateSelectedCellsOverlay({
      selectedLayer,
      xScale: layout.xScale,
      yScale: layout.yScale,
      dataShape: {
        rows: filtered.length,
        cols: filtered[0]?.length ?? 0,
      },
      visibleData: filtered,
      symmetric,
      selectedCells: selectedCellsRef.current,
      visualStyle: resolvedVisualStyle,
    });
  }, [
    filtered,
    layout,
    legendRange,
    resolvedScaleType,
    scaleCenter,
    resolvedColorScaleSettings,
    resolvedVisualStyle,
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
    showAllLabels,
    symmetric,
    svgRef,
    positionTooltipForCell,
    positionTooltipForPointer,
  ]);

  useEffect(() => {
    const selectedLayer = selectedLayerRef.current;
    const xScale = xScaleRef.current;
    const yScale = yScaleRef.current;
    const normalizedData = normalizedRef.current;
    if (!selectedLayer || !xScale || !yScale) return;

    updateSelectedCellsOverlay({
      selectedLayer,
      xScale,
      yScale,
      dataShape: {
        rows: normalizedData.length,
        cols: normalizedData[0]?.length ?? 0,
      },
      visibleData: normalizedData,
      symmetric,
      selectedCells,
      visualStyle: resolvedVisualStyle,
    });
  }, [selectedCells, filtered, width, height, symmetric, resolvedVisualStyle]);

  const syncSharedHover = useCallback((hoverState: SharedHoverState) => {
    const xScale = xScaleRef.current;
    const yScale = yScaleRef.current;
    const highlights = highlightRefs.current;
    const tooltip = tooltipSelRef.current;
    if (!xScale || !yScale || !highlights || !tooltip) return;

    syncHoveredCellOverlay({
      hoveredCell:
        hoverState?.type === "cell"
          ? { rowId: hoverState.rowId, colId: hoverState.colId }
          : null,
      hoveredNodeId: hoverState?.type === "node" ? hoverState.nodeId : null,
      rowLabels: rowLabelsRef.current,
      colLabels: colLabelsRef.current,
      labelNames,
      labelTitles,
      normalizedData: normalizedRef.current,
      xScale,
      yScale,
      size: sizeRef.current,
      highlights,
      tooltip,
      valueLabel,
      positionTooltipForCell,
    });
  }, [
    labelNames,
    labelTitles,
    positionTooltipForCell,
    valueLabel,
  ]);

  useEffect(() => subscribeSharedHover(syncSharedHover), [syncSharedHover]);

  return (
    <div ref={wrapperRef} className="heatmap-wrapper">
      <svg ref={svgRef} width={width} height={height} />
      <div ref={tooltipRef} className="heatmap-tooltip" />
    </div>
  );
}

export default MatrixHeatmap;
