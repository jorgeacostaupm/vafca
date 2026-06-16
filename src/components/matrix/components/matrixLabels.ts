import * as d3 from "d3";
import { type MutableRefObject } from "react";

import { resolveHeatmapTooltipLabel } from "@/components/matrix/matrixTooltip";
import {
  MATRIX_LABEL_BACKGROUND_PADDING_X,
  MATRIX_LABEL_BACKGROUND_PADDING_Y,
  MATRIX_LABEL_BACKGROUND_RADIUS,
} from "@/config/ui";
import type { MatrixVisualStyle } from "@/types/visualizationUi";
import { getReadableTextColor } from "@/utils/groupingColoring";
import { escapeHtml } from "@/utils/html";

const ROW_LABEL_STEP = 1;
const COL_LABEL_STEP = 1;

type SharedLabelArgs = {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelColors?: Record<string, string>;
  visualStyle: MatrixVisualStyle;
  selectedZoomLabels?: string[];
  labelToggleCbRef: MutableRefObject<((label: string) => void) | undefined>;
  labelHoverCbRef: MutableRefObject<((label: string) => void) | undefined>;
  labelLeaveCbRef: MutableRefObject<(() => void) | undefined>;
  positionTooltipForPointer: (clientX: number, clientY: number) => void;
};

type RenderColumnLabelsArgs = SharedLabelArgs & {
  labels: string[];
  data: number[][];
  xScale: d3.ScaleBand<number>;
  colLabelFontSize: number;
};

type RenderRowLabelsArgs = SharedLabelArgs & {
  labels: string[];
  data: number[][];
  yScale: d3.ScaleBand<number>;
  rowLabelFontSize: number;
};

type MatrixAxis = "row" | "column";

const countVisibleLinks = (args: {
  data: number[][];
  index: number;
  axis: MatrixAxis;
}) => {
  const { data, index, axis } = args;
  const size = axis === "row" ? (data[index]?.length ?? 0) : data.length;
  let count = 0;

  for (let offset = 0; offset < size; offset += 1) {
    if (offset === index) continue;
    const value = axis === "row" ? data[index]?.[offset] : data[offset]?.[index];
    if (Number.isFinite(value)) count += 1;
  }

  return count;
};

const resolveTooltipHtml = (args: {
  id: string;
  linkCount: number;
  axis: MatrixAxis;
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
}) => {
  const { id, linkCount, axis, labelNames, labelTitles } = args;
  const nodeName = resolveHeatmapTooltipLabel(id, labelNames, labelTitles);
  const axisLabel = axis === "row" ? "Row" : "Column";
  const linkLabel = linkCount === 1 ? "link" : "links";
  return `<div><strong>${escapeHtml(nodeName)}</strong></div><div>${axisLabel}: ${linkCount} ${linkLabel}</div>`;
};

const resolveTextColor = (args: {
  id: string;
  labelColors?: Record<string, string>;
  zoomLabelSet: Set<string> | null;
  visualStyle: MatrixVisualStyle;
}) => {
  const { id, labelColors, zoomLabelSet, visualStyle } = args;
  if (zoomLabelSet?.has(id)) {
    return getReadableTextColor(visualStyle.selectionColor);
  }

  const backgroundColor = labelColors?.[id];
  if (backgroundColor) return getReadableTextColor(backgroundColor);
  return "#394b59";
};

const resolveFontWeight = (id: string, zoomLabelSet: Set<string> | null) =>
  zoomLabelSet?.has(id) ? 700 : 400;

const applyLabelBackground = (
  group: d3.Selection<SVGGElement, number, SVGGElement, unknown>,
  labelIdByIndex: (index: number) => string,
  labelColors?: Record<string, string>,
  zoomLabelSet?: Set<string> | null,
  visualStyle?: MatrixVisualStyle,
) => {
  group.each(function (index) {
    const id = labelIdByIndex(index);
    const backgroundColor =
      zoomLabelSet?.has(id) && visualStyle
        ? visualStyle.selectionColor
        : labelColors?.[id] ?? null;
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
    rect
      .attr("fill", backgroundColor)
      .attr("stroke", "none")
      .attr("x", box.x - MATRIX_LABEL_BACKGROUND_PADDING_X)
      .attr("y", box.y - MATRIX_LABEL_BACKGROUND_PADDING_Y)
      .attr("width", box.width + MATRIX_LABEL_BACKGROUND_PADDING_X * 2)
      .attr("height", box.height + MATRIX_LABEL_BACKGROUND_PADDING_Y * 2);
  });
};

export const renderColumnLabels = ({
  root,
  tooltip,
  labels,
  data,
  xScale,
  colLabelFontSize,
  labelNames,
  labelTitles,
  labelColors,
  visualStyle,
  selectedZoomLabels,
  labelToggleCbRef,
  labelHoverCbRef,
  labelLeaveCbRef,
  positionTooltipForPointer,
}: RenderColumnLabelsArgs) => {
  const zoomLabelSet =
    selectedZoomLabels && selectedZoomLabels.length > 0
      ? new Set(selectedZoomLabels)
      : null;

  const labelIndices = d3.range(0, labels.length, COL_LABEL_STEP);
  const xLabelOffset = -Math.max(8, colLabelFontSize * 0.65);
  const xLabels = root.append("g").attr("transform", `translate(0, ${xLabelOffset})`);

  const xLabelGroups = xLabels
    .selectAll<SVGGElement, number>("g")
    .data(labelIndices)
    .join("g");

  xLabelGroups
    .attr("transform", (index) => {
      const x = (xScale(index) ?? 0) + xScale.bandwidth() / 2;
      return `translate(${x}, 0) rotate(-90)`;
    })
    .style("cursor", labelToggleCbRef.current ? "pointer" : "default")
    .on("click", (event, index) => {
      if (!labelToggleCbRef.current) return;
      event.stopPropagation();
      labelToggleCbRef.current(labels[index]);
    })
    .on("mouseenter", (_event, index) => {
      labelHoverCbRef.current?.(labels[index]);
    })
    .on("mousemove", (event, index) => {
      const id = labels[index];
      tooltip
        .style("opacity", "1")
        .html(
          resolveTooltipHtml({
            id,
            axis: "column",
            linkCount: countVisibleLinks({ data, index, axis: "column" }),
            labelNames,
            labelTitles,
          }),
        );
      positionTooltipForPointer(event.clientX, event.clientY);
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", "0");
      labelLeaveCbRef.current?.();
    });

  xLabelGroups
    .selectAll("rect")
    .data((index) => [index])
    .join("rect")
    .attr("rx", MATRIX_LABEL_BACKGROUND_RADIUS)
    .attr("ry", MATRIX_LABEL_BACKGROUND_RADIUS);

  xLabelGroups
    .selectAll("text")
    .data((index) => [index])
    .join("text")
    .attr("x", 0)
    .attr("y", 0)
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "middle")
    .attr("font-size", colLabelFontSize)
    .attr("fill", (index) =>
      resolveTextColor({
        id: labels[index],
        labelColors,
        zoomLabelSet,
        visualStyle,
      }),
    )
    .attr("font-weight", (index) => resolveFontWeight(labels[index], zoomLabelSet))
    .text((index) => {
      const id = labels[index];
      return labelNames?.[id] ?? id;
    });

  applyLabelBackground(
    xLabelGroups,
    (index) => labels[index],
    labelColors,
    zoomLabelSet,
    visualStyle,
  );
};

export const renderRowLabels = ({
  root,
  tooltip,
  labels,
  data,
  yScale,
  rowLabelFontSize,
  labelNames,
  labelTitles,
  labelColors,
  visualStyle,
  selectedZoomLabels,
  labelToggleCbRef,
  labelHoverCbRef,
  labelLeaveCbRef,
  positionTooltipForPointer,
}: RenderRowLabelsArgs) => {
  const zoomLabelSet =
    selectedZoomLabels && selectedZoomLabels.length > 0
      ? new Set(selectedZoomLabels)
      : null;

  const labelIndices = d3.range(0, labels.length, ROW_LABEL_STEP);
  const yLabels = root.append("g");
  const yLabelOffset = -Math.max(8, rowLabelFontSize * 0.65);

  const yLabelGroups = yLabels
    .selectAll<SVGGElement, number>("g")
    .data(labelIndices)
    .join("g");

  yLabelGroups
    .attr("transform", (index) => {
      const y = (yScale(index) ?? 0) + yScale.bandwidth() / 2;
      return `translate(${yLabelOffset}, ${y})`;
    })
    .style("cursor", labelToggleCbRef.current ? "pointer" : "default")
    .on("click", (event, index) => {
      if (!labelToggleCbRef.current) return;
      event.stopPropagation();
      labelToggleCbRef.current(labels[index]);
    })
    .on("mouseenter", (_event, index) => {
      labelHoverCbRef.current?.(labels[index]);
    })
    .on("mousemove", (event, index) => {
      const id = labels[index];
      tooltip
        .style("opacity", "1")
        .html(
          resolveTooltipHtml({
            id,
            axis: "row",
            linkCount: countVisibleLinks({ data, index, axis: "row" }),
            labelNames,
            labelTitles,
          }),
        );
      positionTooltipForPointer(event.clientX, event.clientY);
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", "0");
      labelLeaveCbRef.current?.();
    });

  yLabelGroups
    .selectAll("rect")
    .data((index) => [index])
    .join("rect")
    .attr("rx", MATRIX_LABEL_BACKGROUND_RADIUS)
    .attr("ry", MATRIX_LABEL_BACKGROUND_RADIUS);

  yLabelGroups
    .selectAll("text")
    .data((index) => [index])
    .join("text")
    .attr("x", 0)
    .attr("y", 0)
    .attr("text-anchor", "end")
    .attr("alignment-baseline", "middle")
    .attr("font-size", rowLabelFontSize)
    .attr("fill", (index) =>
      resolveTextColor({
        id: labels[index],
        labelColors,
        zoomLabelSet,
        visualStyle,
      }),
    )
    .attr("font-weight", (index) => resolveFontWeight(labels[index], zoomLabelSet))
    .text((index) => {
      const id = labels[index];
      return labelNames?.[id] ?? id;
    });

  applyLabelBackground(
    yLabelGroups,
    (index) => labels[index],
    labelColors,
    zoomLabelSet,
    visualStyle,
  );
};
