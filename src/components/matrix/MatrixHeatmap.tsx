import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import {
  getTooltipPositionForMatrixCell,
  getTooltipPositionForMatrixPointer,
} from "@/components/matrix/matrixHeatmapTooltip";
import { BASE_MARGIN } from "@/components/matrix/heatmap/matrixHeatmapConstants";
import {
  applyHeatmapValueFilters,
  buildNormalizedMatrix,
  computeHeatmapFiniteBounds,
  resolveHeatmapAxisLabels,
  resolveHeatmapLegendRange,
} from "@/components/matrix/heatmap/matrixHeatmapData";
import { buildHeatmapLayout } from "@/components/matrix/heatmap/matrixHeatmapLayout";
import {
  syncHoveredCellOverlay,
  updateSelectedCellsOverlay,
} from "@/components/matrix/heatmap/matrixHeatmapOverlays";
import { renderHeatmapScene } from "@/components/matrix/heatmap/matrixHeatmapScene";
import type {
  HeatmapHighlightSelections,
  MatrixMargin,
} from "@/components/matrix/heatmap/matrixHeatmapTypes";
import type { HeatmapProps } from "@/types/matrixHeatmap";

function MatrixHeatmap({
  data,
  width,
  height,
  title,
  valueLabel = "Value",
  labels,
  rowLabels,
  colLabels,
  labelNames,
  labelTitles,
  labelAcronyms,
  labelColors,
  brushEnabled = false,
  showAllLabels = false,
  selectedZoomLabels,
  matrixShape = "full",
  legendMin,
  legendMax,
  valueFilters,
  hoveredCell,
  selectedCells,
  svgRef: svgRefProp,
  onCellHover,
  onCellLeave,
  onCellSelect,
  onBrushZoom,
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
  const labelToggleCbRef = useRef(onLabelToggle);

  const positionTooltipForCell = (
    colX: number,
    rowY: number,
    bandwidthX: number,
    bandwidthY: number,
  ) => {
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
  };

  const positionTooltipForPointer = (clientX: number, clientY: number) => {
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
  };

  useEffect(() => {
    hoverCbRef.current = onCellHover;
    leaveCbRef.current = onCellLeave;
    selectCbRef.current = onCellSelect;
    brushCbRef.current = onBrushZoom;
    labelToggleCbRef.current = onLabelToggle;
  }, [onCellHover, onCellLeave, onCellSelect, onBrushZoom, onLabelToggle]);

  const normalized = useMemo(
    () => buildNormalizedMatrix(data, matrixShape),
    [data, matrixShape],
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
  }, [
    filtered,
    layout,
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
    showAllLabels,
    matrixShape,
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
      selectedCells,
    });
  }, [selectedCells, filtered, width, height]);

  useEffect(() => {
    const xScale = xScaleRef.current;
    const yScale = yScaleRef.current;
    const highlights = highlightRefs.current;
    const tooltip = tooltipSelRef.current;
    if (!xScale || !yScale || !highlights || !tooltip) return;

    syncHoveredCellOverlay({
      hoveredCell,
      rowLabels: rowLabelsRef.current,
      colLabels: colLabelsRef.current,
      labelNames,
      normalizedData: normalizedRef.current,
      xScale,
      yScale,
      size: sizeRef.current,
      highlights,
      tooltip,
      valueLabel,
      positionTooltipForCell,
    });
  }, [hoveredCell, labelNames, valueLabel]);

  return (
    <div ref={wrapperRef} className="heatmap-wrapper">
      <svg ref={svgRef} width={width} height={height} />
      <div ref={tooltipRef} className="heatmap-tooltip" />
    </div>
  );
}

export default MatrixHeatmap;
