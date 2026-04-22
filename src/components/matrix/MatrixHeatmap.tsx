import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as d3 from "d3";
import { resolveMatrixValue, type MatrixShape } from "@/utils/matrixValue";
import { getReadableTextColor } from "@/utils/atlas/coloring";
import { escapeHtml } from "@/utils/html";
import { valuePassesRangeFilter } from "@/utils/matrixFiltering";
import {
  formatHeatmapTooltipHtml,
  getTooltipPositionForMatrixCell,
  getTooltipPositionForMatrixPointer,
} from "@/components/matrix/matrixHeatmapTooltip";

export type HeatmapProps = {
  data: number[][];
  width: number;
  height: number;
  title?: string;
  valueLabel?: string;
  labels?: string[];
  rowLabels?: string[];
  colLabels?: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  labelColors?: Record<string, string>;
  brushEnabled?: boolean;
  showAllLabels?: boolean;
  selectedZoomLabels?: string[];
  matrixShape?: MatrixShape;
  legendMin?: number;
  legendMax?: number;
  valueFilters?: {
    measure?: [number, number] | null;
    stat?: [number, number] | Array<[number, number]> | null;
  };
  hoveredCell?: { rowId: string; colId: string } | null;
  selectedCells?: Array<{ row: number; col: number }>;
  svgRef?: RefObject<SVGSVGElement>;
  onCellHover?: (payload: {
    row: number;
    col: number;
    value: number;
    rowId: string;
    colId: string;
    rowLabel: string;
    colLabel: string;
  }) => void;
  onCellLeave?: () => void;
  onCellSelect?: (payload: {
    row: number;
    col: number;
    value: number;
    rowId: string;
    colId: string;
    rowLabel: string;
    colLabel: string;
  }) => void;
  onBrushZoom?: (payload: {
    rows: number[];
    cols: number[];
    rowLabels: string[];
    colLabels: string[];
  }) => void;
  onLabelToggle?: (label: string) => void;
};

const BASE_MARGIN = { top: 54, right: 54, bottom: 10, left: 54 };
const HIGHLIGHT_COLOR = "#f0b429";
const HIGHLIGHT_GAP = 1.2;
const SELECTED_COLOR = "#d64545";
const SELECTED_STROKE = 2;

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
    HTMLDivElement | null,
    unknown,
    null,
    undefined
  > | null>(null);
  const xScaleRef = useRef<d3.ScaleBand<number> | null>(null);
  const yScaleRef = useRef<d3.ScaleBand<number> | null>(null);
  const marginRef = useRef(BASE_MARGIN);
  const sizeRef = useRef(0);
  const rowLabelsRef = useRef<string[] | undefined>(undefined);
  const colLabelsRef = useRef<string[] | undefined>(undefined);
  const normalizedRef = useRef<number[][]>([]);
  const highlightRefs = useRef<{
    cell: d3.Selection<SVGRectElement, unknown, null, undefined>;
    rowTop: d3.Selection<SVGLineElement, unknown, null, undefined>;
    rowBottom: d3.Selection<SVGLineElement, unknown, null, undefined>;
    colLeft: d3.Selection<SVGLineElement, unknown, null, undefined>;
    colRight: d3.Selection<SVGLineElement, unknown, null, undefined>;
  } | null>(null);
  const selectedLayerRef = useRef<d3.Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  > | null>(null);
  const hoverCbRef = useRef(onCellHover);
  const leaveCbRef = useRef(onCellLeave);
  const selectCbRef = useRef(onCellSelect);
  const brushCbRef = useRef(onBrushZoom);
  const labelToggleCbRef = useRef(onLabelToggle);
  const positionTooltipForCell = (
    colX: number,
    rowY: number,
    bw: number,
    bh: number,
  ) => {
    const tooltipEl = tooltipRef.current;
    if (!tooltipEl) return;
    const { left, top } = getTooltipPositionForMatrixCell({
      colX,
      rowY,
      bandwidthX: bw,
      bandwidthY: bh,
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

  const normalized = useMemo(() => {
    const rows = data.length;
    return Array.from({ length: rows }, (_, row) => {
      const cols = data[row]?.length ?? 0;
      return Array.from({ length: cols }, (_, col) =>
        resolveMatrixValue(data, row, col, matrixShape),
      );
    });
  }, [data, matrixShape]);

  const filtered = useMemo(() => {
    if (!valueFilters?.measure && !valueFilters?.stat) return normalized;
    const measureRange = valueFilters.measure ?? null;
    const statRange = valueFilters.stat ?? null;

    return normalized.map((row) =>
      row.map((value) => {
        if (!Number.isFinite(value)) return value;
        if (!valuePassesRangeFilter(value, measureRange)) return Number.NaN;
        if (!valuePassesRangeFilter(value, statRange)) return Number.NaN;
        return value;
      }),
    );
  }, [normalized, valueFilters]);

  const { minValue, maxValue } = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const row of filtered) {
      for (const value of row) {
        if (!Number.isFinite(value)) continue;
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
    return {
      minValue: Number.isFinite(min) ? min : 0,
      maxValue: Number.isFinite(max) ? max : 1,
    };
  }, [filtered]);
  const legendRange = useMemo(() => {
    const hasMin = Number.isFinite(legendMin);
    const hasMax = Number.isFinite(legendMax);
    let min = hasMin ? (legendMin as number) : minValue;
    let max = hasMax ? (legendMax as number) : maxValue;

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      min = minValue;
      max = maxValue;
    }

    if (min > max) {
      [min, max] = [max, min];
    }

    if (min === max) {
      if (minValue !== maxValue) {
        min = Math.min(minValue, maxValue);
        max = Math.max(minValue, maxValue);
      } else {
        min -= 1;
        max += 1;
      }
    }

    return { min, max };
  }, [legendMin, legendMax, minValue, maxValue]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rows = filtered.length;
    const cols = rows ? filtered[0].length : 0;

    const tooltip = d3.select(tooltipRef.current);
    tooltipSelRef.current = tooltip;
    const resolvedRowLabels =
      rowLabels?.length === rows
        ? rowLabels
        : labels?.length === rows
          ? labels
          : undefined;
    const resolvedColLabels =
      colLabels?.length === cols
        ? colLabels
        : labels?.length === cols
          ? labels
          : undefined;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);
    const estimateLabelWidth = (charCount: number, fontSize: number) =>
      charCount * fontSize * 0.58;
    const safeDisplayLabel = (id: string) => labelNames?.[id] ?? id;
    const maxRowCharsWidth = resolvedRowLabels
      ? resolvedRowLabels.reduce((acc, id) => {
          const label = safeDisplayLabel(id);
          return Math.max(acc, label.length);
        }, 0)
      : 0;
    const maxColCharsWidth = resolvedColLabels
      ? resolvedColLabels.reduce((acc, id) => {
          const label = safeDisplayLabel(id);
          return Math.max(acc, label.length);
        }, 0)
      : 0;

    let dynamicMargin = { ...BASE_MARGIN };
    for (let iteration = 0; iteration < 2; iteration += 1) {
      const innerWidth = Math.max(
        width - dynamicMargin.left - dynamicMargin.right,
        0,
      );
      const innerHeight = Math.max(
        height - dynamicMargin.top - dynamicMargin.bottom,
        0,
      );
      const size = Math.min(innerWidth, innerHeight);
      const rowBand = rows > 0 ? size / rows : size;
      const colBand = cols > 0 ? size / cols : size;
      const rowFontSize = clamp(rowBand * 0.56, 8, 16);
      const colFontSize = clamp(colBand * 0.56, 8, 16);

      const topLabelSpace = estimateLabelWidth(maxColCharsWidth, colFontSize);
      const leftLabelSpace = estimateLabelWidth(maxRowCharsWidth, rowFontSize);

      dynamicMargin.top = clamp(
        Math.max(BASE_MARGIN.top, topLabelSpace + 12),
        BASE_MARGIN.top,
        Math.max(BASE_MARGIN.top, height * 0.45),
      );
      dynamicMargin.left = clamp(
        Math.max(BASE_MARGIN.left, leftLabelSpace + 12),
        BASE_MARGIN.left,
        Math.max(BASE_MARGIN.left, width * 0.45),
      );
    }

    marginRef.current = dynamicMargin;

    const innerWidth = Math.max(
      width - dynamicMargin.left - dynamicMargin.right,
      0,
    );
    const innerHeight = Math.max(
      height - dynamicMargin.top - dynamicMargin.bottom,
      0,
    );
    const size = Math.min(innerWidth, innerHeight);

    const xScale = d3
      .scaleBand<number>()
      .domain(d3.range(cols))
      .range([0, size]);
    const yScale = d3
      .scaleBand<number>()
      .domain(d3.range(rows))
      .range([0, size]);

    xScaleRef.current = xScale;
    yScaleRef.current = yScale;
    sizeRef.current = size;
    normalizedRef.current = filtered;

    rowLabelsRef.current = resolvedRowLabels;
    colLabelsRef.current = resolvedColLabels;

    // Always show one label per row as requested.
    const rowLabelStep = 1;
    // Always show one label per column as requested.
    const colLabelStep = 1;

    // Scale label sizes using visible space per row/column so they grow/shrink
    // with zoom/resize and with the amount of visible labels.
    const rowLabelFontSize = clamp(yScale.bandwidth() * 0.56, 8, 16);
    const colLabelFontSize = clamp(xScale.bandwidth() * 0.56, 8, 16);

    const isDiverging = legendRange.min < 0 && legendRange.max > 0;
    const color = isDiverging
      ? d3
          .scaleDiverging(d3.interpolateRdBu)
          .domain([legendRange.min, 0, legendRange.max])
          .clamp(true)
      : d3
          .scaleSequential(d3.interpolateYlGnBu)
          .domain([legendRange.min, legendRange.max])
          .clamp(true);

    const root = svg
      .append("g")
      .attr(
        "transform",
        `translate(${dynamicMargin.left}, ${dynamicMargin.top})`,
      );

    if (title) {
      root
        .append("text")
        .attr("x", 0)
        .attr("y", -8)
        .attr("font-size", 12)
        .attr("font-weight", 600)
        .attr("fill", "#1b2b38")
        .text(title);
    }

    const cells: Array<{ row: number; col: number; value: number }> = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        cells.push({ row, col, value: filtered[row][col] });
      }
    }

    const cellsLayer = root.append("g");
    cellsLayer
      .selectAll("rect")
      .data(cells)
      .join("rect")
      .attr("x", (d) => xScale(d.col) ?? 0)
      .attr("y", (d) => yScale(d.row) ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) =>
        Number.isFinite(d.value) ? color(d.value) : "transparent",
      )
      .attr("opacity", (d) =>
        Number.isFinite(d.value) ? (d.value === 0 ? 0.12 : 1) : 0,
      )
      .attr("pointer-events", (d) =>
        Number.isFinite(d.value) ? "all" : "none",
      )
      .on("mousemove", (_event, d) => {
        if (!tooltipRef.current) return;
        const rowY = yScale(d.row) ?? 0;
        const colX = xScale(d.col) ?? 0;
        const bw = xScale.bandwidth();
        const bh = yScale.bandwidth();
        cellHighlight
          .attr("x", colX)
          .attr("y", rowY)
          .attr("width", bw)
          .attr("height", bh)
          .attr("visibility", "visible");
        rowLineTop
          .attr("x1", 0)
          .attr("x2", size)
          .attr("y1", rowY - HIGHLIGHT_GAP)
          .attr("y2", rowY - HIGHLIGHT_GAP)
          .attr("visibility", "visible");
        rowLineBottom
          .attr("x1", 0)
          .attr("x2", size)
          .attr("y1", rowY + bh + HIGHLIGHT_GAP)
          .attr("y2", rowY + bh + HIGHLIGHT_GAP)
          .attr("visibility", "visible");
        colLineLeft
          .attr("y1", 0)
          .attr("y2", size)
          .attr("x1", colX - HIGHLIGHT_GAP)
          .attr("x2", colX - HIGHLIGHT_GAP)
          .attr("visibility", "visible");
        colLineRight
          .attr("y1", 0)
          .attr("y2", size)
          .attr("x1", colX + bw + HIGHLIGHT_GAP)
          .attr("x2", colX + bw + HIGHLIGHT_GAP)
          .attr("visibility", "visible");
        const rowId = resolvedRowLabels?.[d.row] ?? String(d.row);
        const colId = resolvedColLabels?.[d.col] ?? String(d.col);
        const rowLabel = labelNames?.[rowId] ?? rowId;
        const colLabel = labelNames?.[colId] ?? colId;
        hoverCbRef.current?.({
          row: d.row,
          col: d.col,
          value: d.value,
          rowId,
          colId,
          rowLabel,
          colLabel,
        });
        tooltip
          .style("opacity", "1")
          .html(formatHeatmapTooltipHtml(rowLabel, colLabel, d.value, valueLabel));
        positionTooltipForCell(colX, rowY, bw, bh);
      })
      .on("click", (_event, d) => {
        const rowId = resolvedRowLabels?.[d.row] ?? String(d.row);
        const colId = resolvedColLabels?.[d.col] ?? String(d.col);
        const rowLabel = labelNames?.[rowId] ?? rowId;
        const colLabel = labelNames?.[colId] ?? colId;
        selectCbRef.current?.({
          row: d.row,
          col: d.col,
          value: d.value,
          rowId,
          colId,
          rowLabel,
          colLabel,
        });
      })
      .on("mouseleave", () => {
        tooltip.style("opacity", "0");
        cellHighlight.attr("visibility", "hidden");
        rowLineTop.attr("visibility", "hidden");
        rowLineBottom.attr("visibility", "hidden");
        colLineLeft.attr("visibility", "hidden");
        colLineRight.attr("visibility", "hidden");
        leaveCbRef.current?.();
      });

    const selectedLayer = root.append("g").attr("class", "heatmap-selected");
    selectedLayerRef.current = selectedLayer;

    const highlightLayer = root.append("g").attr("class", "heatmap-highlight");
    const cellHighlight = highlightLayer
      .append("rect")
      .attr("fill", "none")
      .attr("stroke", HIGHLIGHT_COLOR)
      .attr("stroke-width", 2)
      .attr("visibility", "hidden");
    const rowLineTop = highlightLayer
      .append("line")
      .attr("stroke", HIGHLIGHT_COLOR)
      .attr("stroke-width", 1.6)
      .attr("visibility", "hidden");
    const rowLineBottom = highlightLayer
      .append("line")
      .attr("stroke", HIGHLIGHT_COLOR)
      .attr("stroke-width", 1.6)
      .attr("visibility", "hidden");
    const colLineLeft = highlightLayer
      .append("line")
      .attr("stroke", HIGHLIGHT_COLOR)
      .attr("stroke-width", 1.6)
      .attr("visibility", "hidden");
    const colLineRight = highlightLayer
      .append("line")
      .attr("stroke", HIGHLIGHT_COLOR)
      .attr("stroke-width", 1.6)
      .attr("visibility", "hidden");
    highlightRefs.current = {
      cell: cellHighlight,
      rowTop: rowLineTop,
      rowBottom: rowLineBottom,
      colLeft: colLineLeft,
      colRight: colLineRight,
    };

    const zoomLabelSet =
      selectedZoomLabels && selectedZoomLabels.length > 0
        ? new Set(selectedZoomLabels)
        : null;

    const resolveLabelColor = (id: string) => labelColors?.[id] ?? null;

    if (resolvedColLabels) {
      const labelIndices = d3.range(0, resolvedColLabels.length, colLabelStep);
      const xLabelOffset = -Math.max(8, colLabelFontSize * 0.65);
      const xLabels = root
        .append("g")
        .attr("transform", `translate(0, ${xLabelOffset})`);

      const xLabelGroups = xLabels.selectAll("g").data(labelIndices).join("g");
      xLabelGroups
        .attr("transform", (d) => {
          const x = (xScale(d) ?? 0) + xScale.bandwidth() / 2;
          return `translate(${x}, 0) rotate(-90)`;
        })
        .style("cursor", labelToggleCbRef.current ? "pointer" : "default")
      .on("click", (_event, d) => {
          if (!labelToggleCbRef.current) return;
          _event.stopPropagation();
          labelToggleCbRef.current(resolvedColLabels[d]);
        })
        .on("mousemove", (event, d) => {
          const id = resolvedColLabels[d];
          const roiName = labelTitles?.[id] ?? labelNames?.[id] ?? id;
          const acronym = labelAcronyms?.[id] ?? id;
          tooltip
            .style("opacity", "1")
            .html(
              `<div><strong>${escapeHtml(roiName)} (${escapeHtml(
                acronym,
              )})</strong></div>`,
            );
          positionTooltipForPointer(event.clientX, event.clientY);
        })
        .on("mouseleave", () => {
          tooltip.style("opacity", "0");
        });

      xLabelGroups
        .selectAll("rect")
        .data((d) => [d])
        .join("rect")
        .attr("rx", 2)
        .attr("ry", 2);

      xLabelGroups
        .selectAll("text")
        .data((d) => [d])
        .join("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .attr("font-size", colLabelFontSize)
        .attr("fill", (d) => {
          const id = resolvedColLabels[d];
          const backgroundColor = resolveLabelColor(id);
          if (backgroundColor) return getReadableTextColor(backgroundColor);
          return zoomLabelSet?.has(id) ? "#1b2b38" : "#394b59";
        })
        .attr("font-weight", (d) => {
          const id = resolvedColLabels[d];
          return zoomLabelSet?.has(id) ? 700 : 400;
        })
        .text((d) => {
          const id = resolvedColLabels[d];
          return labelNames?.[id] ?? id;
        });

      xLabelGroups.each(function (d) {
        const id = resolvedColLabels[d];
        const backgroundColor = resolveLabelColor(id);
        const textNode = d3.select(this).select<SVGTextElement>("text").node();
        const rect = d3.select(this).select<SVGRectElement>("rect");
        if (!textNode || !backgroundColor) {
          rect
            .attr("fill", "transparent")
            .attr("stroke", "none")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 0)
            .attr("height", 0);
          return;
        }
        const box = textNode.getBBox();
        const padX = 2;
        const padY = 1;
        rect
          .attr("fill", backgroundColor)
          .attr("stroke", "none")
          .attr("x", box.x - padX)
          .attr("y", box.y - padY)
          .attr("width", box.width + padX * 2)
          .attr("height", box.height + padY * 2);
      });
    }

    if (resolvedRowLabels) {
      const labelIndices = d3.range(0, resolvedRowLabels.length, rowLabelStep);
      const yLabels = root.append("g");
      const yLabelGroups = yLabels.selectAll("g").data(labelIndices).join("g");
      const yLabelOffset = -Math.max(8, rowLabelFontSize * 0.65);
      yLabelGroups
        .attr("transform", (d) => {
          const y = (yScale(d) ?? 0) + yScale.bandwidth() / 2;
          return `translate(${yLabelOffset}, ${y})`;
        })
        .style("cursor", onLabelToggle ? "pointer" : "default")
        .on("click", (event, d) => {
          if (!labelToggleCbRef.current) return;
          event.stopPropagation();
          labelToggleCbRef.current(resolvedRowLabels[d]);
        })
        .on("mousemove", (event, d) => {
          const id = resolvedRowLabels[d];
          const roiName = labelTitles?.[id] ?? labelNames?.[id] ?? id;
          const acronym = labelAcronyms?.[id] ?? id;
          tooltip
            .style("opacity", "1")
            .html(
              `<div><strong>${escapeHtml(roiName)} (${escapeHtml(
                acronym,
              )})</strong></div>`,
            );
          positionTooltipForPointer(event.clientX, event.clientY);
        })
        .on("mouseleave", () => {
          tooltip.style("opacity", "0");
        });

      yLabelGroups
        .selectAll("rect")
        .data((d) => [d])
        .join("rect")
        .attr("rx", 2)
        .attr("ry", 2);

      yLabelGroups
        .selectAll("text")
        .data((d) => [d])
        .join("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "middle")
        .attr("font-size", rowLabelFontSize)
        .attr("fill", (d) => {
          const id = resolvedRowLabels[d];
          const backgroundColor = resolveLabelColor(id);
          if (backgroundColor) return getReadableTextColor(backgroundColor);
          return zoomLabelSet?.has(id) ? "#1b2b38" : "#394b59";
        })
        .attr("font-weight", (d) => {
          const id = resolvedRowLabels[d];
          return zoomLabelSet?.has(id) ? 700 : 400;
        })
        .text((d) => {
          const id = resolvedRowLabels[d];
          return labelNames?.[id] ?? id;
        });

      yLabelGroups.each(function (d) {
        const id = resolvedRowLabels[d];
        const backgroundColor = resolveLabelColor(id);
        const textNode = d3.select(this).select<SVGTextElement>("text").node();
        const rect = d3.select(this).select<SVGRectElement>("rect");
        if (!textNode || !backgroundColor) {
          rect
            .attr("fill", "transparent")
            .attr("stroke", "none")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 0)
            .attr("height", 0);
          return;
        }
        const box = textNode.getBBox();
        const padX = 2;
        const padY = 1;
        rect
          .attr("fill", backgroundColor)
          .attr("stroke", "none")
          .attr("x", box.x - padX)
          .attr("y", box.y - padY)
          .attr("width", box.width + padX * 2)
          .attr("height", box.height + padY * 2);
      });
    }

    const legendHeight = Math.max(size, 0);
    const legendWidth = 10;
    const legendX = size + 16;
    const legendY = 0;

    const legendScale = d3
      .scaleLinear()
      .domain([legendRange.min, legendRange.max])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(5);

    const legendGradientId = `legend-${Math.random().toString(36).slice(2)}`;

    const defs = svg.append("defs");
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", legendGradientId)
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    const stops = d3.range(0, 1.01, 0.1);
    stops.forEach((stop) => {
      const value =
        legendRange.min + (legendRange.max - legendRange.min) * stop;
      linearGradient
        .append("stop")
        .attr("offset", `${stop * 100}%`)
        .attr("stop-color", color(value));
    });

    root
      .append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("fill", `url(#${legendGradientId})`);

    root
      .append("g")
      .attr("transform", `translate(${legendX + legendWidth}, ${legendY})`)
      .call(legendAxis);

    if (brushEnabled) {
      const brushLayer = root.append("g").attr("class", "heatmap-brush");
      const brush = d3
        .brush()
        .extent([
          [0, 0],
          [size, size],
        ])
        .on("end", (event) => {
          if (!event.selection) return;
          const [[x0, y0], [x1, y1]] = event.selection as [
            [number, number],
            [number, number],
          ];
          const selectedCols: number[] = [];
          const selectedRows: number[] = [];
          for (let col = 0; col < cols; col += 1) {
            const x = xScale(col) ?? 0;
            const bw = xScale.bandwidth();
            if (x + bw >= x0 && x <= x1) {
              selectedCols.push(col);
            }
          }
          for (let row = 0; row < rows; row += 1) {
            const y = yScale(row) ?? 0;
            const bh = yScale.bandwidth();
            if (y + bh >= y0 && y <= y1) {
              selectedRows.push(row);
            }
          }

          const rowLabels =
            resolvedRowLabels && selectedRows.length > 0
              ? selectedRows.map((row) => resolvedRowLabels[row] ?? String(row))
              : selectedRows.map((row) => String(row));
          const colLabels =
            resolvedColLabels && selectedCols.length > 0
              ? selectedCols.map((col) => resolvedColLabels[col] ?? String(col))
              : selectedCols.map((col) => String(col));

          brushCbRef.current?.({
            rows: selectedRows,
            cols: selectedCols,
            rowLabels,
            colLabels,
          });

          brushLayer.call(brush.move, null);
        });

      brushLayer.call(brush as unknown as d3.BrushBehavior<unknown>);
    }
  }, [
    filtered,
    width,
    height,
    legendRange,
    title,
    labels,
    rowLabels,
    colLabels,
    labelNames,
    labelTitles,
    labelAcronyms,
    labelColors,
    brushEnabled,
    showAllLabels,
    selectedZoomLabels,
    matrixShape,
  ]);

  useEffect(() => {
    const selectedLayer = selectedLayerRef.current;
    const xScale = xScaleRef.current;
    const yScale = yScaleRef.current;
    const normalizedData = normalizedRef.current;
    if (!selectedLayer || !xScale || !yScale) return;

    const rows = normalizedData.length;
    const cols = rows ? normalizedData[0].length : 0;
    const inset = 0.6;
    const bw = Math.max(xScale.bandwidth() - inset * 2, 0);
    const bh = Math.max(yScale.bandwidth() - inset * 2, 0);

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
      .data(points, (d) => `${d.row}:${d.col}`)
      .join(
        (enter) => enter.append("rect"),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr("x", (d) => (xScale(d.col) ?? 0) + inset)
      .attr("y", (d) => (yScale(d.row) ?? 0) + inset)
      .attr("width", bw)
      .attr("height", bh)
      .attr("fill", "none")
      .attr("stroke", SELECTED_COLOR)
      .attr("stroke-width", SELECTED_STROKE)
      .attr("pointer-events", "none");
  }, [selectedCells, filtered, width, height]);

  useEffect(() => {
    const xScale = xScaleRef.current;
    const yScale = yScaleRef.current;
    const size = sizeRef.current;
    const rowLabels = rowLabelsRef.current;
    const colLabels = colLabelsRef.current;
    const normalizedData = normalizedRef.current;
    const highlights = highlightRefs.current;
    const tooltip = tooltipSelRef.current;
    if (!xScale || !yScale || !highlights || !tooltip) return;

    if (hoveredCell && rowLabels && colLabels) {
      const rowIndex = rowLabels.indexOf(hoveredCell.rowId);
      const colIndex = colLabels.indexOf(hoveredCell.colId);
      if (rowIndex === -1 || colIndex === -1) {
        tooltip.style("opacity", "0");
        highlights.rowTop.attr("visibility", "hidden");
        highlights.rowBottom.attr("visibility", "hidden");
        highlights.colLeft.attr("visibility", "hidden");
        highlights.colRight.attr("visibility", "hidden");
        highlights.cell.attr("visibility", "hidden");
        return;
      }

      const rowY = yScale(rowIndex) ?? 0;
      const colX = xScale(colIndex) ?? 0;
      const bw = xScale.bandwidth();
      const bh = yScale.bandwidth();

      highlights.cell
        .attr("x", colX)
        .attr("y", rowY)
        .attr("width", bw)
        .attr("height", bh)
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
        .attr("y1", rowY + bh + HIGHLIGHT_GAP)
        .attr("y2", rowY + bh + HIGHLIGHT_GAP)
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
        .attr("x1", colX + bw + HIGHLIGHT_GAP)
        .attr("x2", colX + bw + HIGHLIGHT_GAP)
        .attr("visibility", "visible");

      const rowId = rowLabels[rowIndex] ?? String(rowIndex);
      const colId = colLabels[colIndex] ?? String(colIndex);
      const rowLabel = labelNames?.[rowId] ?? rowId;
      const colLabel = labelNames?.[colId] ?? colId;
      const value = normalizedData[rowIndex]?.[colIndex];
      const numericValue = value ?? Number.NaN;
      if (!Number.isFinite(numericValue)) {
        tooltip.style("opacity", "0");
        highlights.rowTop.attr("visibility", "hidden");
        highlights.rowBottom.attr("visibility", "hidden");
        highlights.colLeft.attr("visibility", "hidden");
        highlights.colRight.attr("visibility", "hidden");
        highlights.cell.attr("visibility", "hidden");
        return;
      }
      tooltip
        .style("opacity", "1")
        .html(
          formatHeatmapTooltipHtml(rowLabel, colLabel, numericValue, valueLabel),
        );
      positionTooltipForCell(colX, rowY, bw, bh);
      return;
    }

    tooltip.style("opacity", "0");
    highlights.rowTop.attr("visibility", "hidden");
    highlights.rowBottom.attr("visibility", "hidden");
    highlights.colLeft.attr("visibility", "hidden");
    highlights.colRight.attr("visibility", "hidden");
    highlights.cell.attr("visibility", "hidden");
  }, [hoveredCell, labelNames, valueLabel]);

  return (
    <div ref={wrapperRef} className="heatmap-wrapper">
      <svg ref={svgRef} width={width} height={height} />
      <div ref={tooltipRef} className="heatmap-tooltip" />
    </div>
  );
}

export default MatrixHeatmap;
