import { type MutableRefObject } from "react";
import * as d3 from "d3";
import { getReadableTextColor } from "@/utils/atlas/coloring";
import { escapeHtml } from "@/utils/html";

const ROW_LABEL_STEP = 1;
const COL_LABEL_STEP = 1;

type SharedLabelArgs = {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  labelColors?: Record<string, string>;
  selectedZoomLabels?: string[];
  labelToggleCbRef: MutableRefObject<((label: string) => void) | undefined>;
  positionTooltipForPointer: (clientX: number, clientY: number) => void;
};

type RenderColumnLabelsArgs = SharedLabelArgs & {
  labels: string[];
  xScale: d3.ScaleBand<number>;
  colLabelFontSize: number;
};

type RenderRowLabelsArgs = SharedLabelArgs & {
  labels: string[];
  yScale: d3.ScaleBand<number>;
  rowLabelFontSize: number;
};

const resolveTooltipHtml = (args: {
  id: string;
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
}) => {
  const { id, labelNames, labelTitles, labelAcronyms } = args;
  const roiName = labelTitles?.[id] ?? labelNames?.[id] ?? id;
  const acronym = labelAcronyms?.[id] ?? id;
  return `<div><strong>${escapeHtml(roiName)} (${escapeHtml(acronym)})</strong></div>`;
};

const resolveTextColor = (args: {
  id: string;
  labelColors?: Record<string, string>;
  zoomLabelSet: Set<string> | null;
}) => {
  const { id, labelColors, zoomLabelSet } = args;
  const backgroundColor = labelColors?.[id];
  if (backgroundColor) return getReadableTextColor(backgroundColor);
  return zoomLabelSet?.has(id) ? "#1b2b38" : "#394b59";
};

const resolveFontWeight = (id: string, zoomLabelSet: Set<string> | null) =>
  zoomLabelSet?.has(id) ? 700 : 400;

const applyLabelBackground = (
  group: d3.Selection<SVGGElement, number, SVGGElement, unknown>,
  labelIdByIndex: (index: number) => string,
  labelColors?: Record<string, string>,
) => {
  group.each(function (index) {
    const id = labelIdByIndex(index);
    const backgroundColor = labelColors?.[id] ?? null;
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
};

export const renderColumnLabels = ({
  root,
  tooltip,
  labels,
  xScale,
  colLabelFontSize,
  labelNames,
  labelTitles,
  labelAcronyms,
  labelColors,
  selectedZoomLabels,
  labelToggleCbRef,
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
    .on("mousemove", (event, index) => {
      const id = labels[index];
      tooltip
        .style("opacity", "1")
        .html(
          resolveTooltipHtml({
            id,
            labelNames,
            labelTitles,
            labelAcronyms,
          }),
        );
      positionTooltipForPointer(event.clientX, event.clientY);
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", "0");
    });

  xLabelGroups
    .selectAll("rect")
    .data((index) => [index])
    .join("rect")
    .attr("rx", 2)
    .attr("ry", 2);

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
      }),
    )
    .attr("font-weight", (index) => resolveFontWeight(labels[index], zoomLabelSet))
    .text((index) => {
      const id = labels[index];
      return labelNames?.[id] ?? id;
    });

  applyLabelBackground(xLabelGroups, (index) => labels[index], labelColors);
};

export const renderRowLabels = ({
  root,
  tooltip,
  labels,
  yScale,
  rowLabelFontSize,
  labelNames,
  labelTitles,
  labelAcronyms,
  labelColors,
  selectedZoomLabels,
  labelToggleCbRef,
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
    .on("mousemove", (event, index) => {
      const id = labels[index];
      tooltip
        .style("opacity", "1")
        .html(
          resolveTooltipHtml({
            id,
            labelNames,
            labelTitles,
            labelAcronyms,
          }),
        );
      positionTooltipForPointer(event.clientX, event.clientY);
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", "0");
    });

  yLabelGroups
    .selectAll("rect")
    .data((index) => [index])
    .join("rect")
    .attr("rx", 2)
    .attr("ry", 2);

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
      }),
    )
    .attr("font-weight", (index) => resolveFontWeight(labels[index], zoomLabelSet))
    .text((index) => {
      const id = labels[index];
      return labelNames?.[id] ?? id;
    });

  applyLabelBackground(yLabelGroups, (index) => labels[index], labelColors);
};
