import * as d3 from "d3";
import type { HeatmapLegendRange } from "@/components/matrix/components/matrixTypes";

const uniqueSortedTicks = (values: number[]) => {
  const sorted = values
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const epsilon = 1e-12;
  return sorted.filter(
    (value, index) => index === 0 || Math.abs(value - sorted[index - 1]) > epsilon,
  );
};

const getLegendCenterValue = (legendRange: HeatmapLegendRange) => {
  if (legendRange.min < 0 && legendRange.max > 0) return 0;
  return (legendRange.min + legendRange.max) / 2;
};

const buildLegendTicks = (legendRange: HeatmapLegendRange) => {
  const { min, max } = legendRange;
  return uniqueSortedTicks([min, getLegendCenterValue(legendRange), max]);
};

const buildLegendTickFormatter = (legendRange: HeatmapLegendRange) => {
  const span = Math.abs(legendRange.max - legendRange.min);
  if (span >= 100) return d3.format(".3~s");
  if (span >= 10) return d3.format(".3~f");
  if (span >= 1) return d3.format(".2~f");
  if (span >= 0.01) return d3.format(".3~f");
  return d3.format(".3~g");
};

export const createHeatmapColorResolver = (
  legendRange: HeatmapLegendRange,
  invertColorScale = false,
) => {
  const isDiverging = legendRange.min < 0 && legendRange.max > 0;

  if (isDiverging) {
    const diverging = d3
      .scaleDiverging(d3.interpolateRdBu)
      .domain(
        invertColorScale
          ? [legendRange.max, 0, legendRange.min]
          : [legendRange.min, 0, legendRange.max],
      )
      .clamp(true);
    return (value: number) => diverging(value);
  }

  const sequential = d3
    .scaleSequential(d3.interpolateYlGnBu)
    .domain(
      invertColorScale
        ? [legendRange.max, legendRange.min]
        : [legendRange.min, legendRange.max],
    )
    .clamp(true);

  return (value: number) => sequential(value);
};

export const renderHeatmapLegend = (args: {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  size: number;
  legendRange: HeatmapLegendRange;
  colorResolver: (value: number) => string;
  invertColorScale?: boolean;
}) => {
  const { svg, root, size, legendRange, colorResolver, invertColorScale = false } = args;

  const legendHeight = Math.max(size, 0);
  const legendWidth = 10;
  const legendX = size + 16;
  const legendY = 0;

  const legendScale = d3
    .scaleLinear()
    .domain(
      invertColorScale
        ? [legendRange.max, legendRange.min]
        : [legendRange.min, legendRange.max],
    )
    .range([legendHeight, 0]);

  const legendAxis = d3
    .axisRight(legendScale)
    .tickValues(buildLegendTicks(legendRange))
    .tickFormat(buildLegendTickFormatter(legendRange));

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
    const value = invertColorScale
      ? legendRange.max - (legendRange.max - legendRange.min) * stop
      : legendRange.min + (legendRange.max - legendRange.min) * stop;
    linearGradient
      .append("stop")
      .attr("offset", `${stop * 100}%`)
      .attr("stop-color", colorResolver(value));
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
    .attr("class", "heatmap-legend-axis")
    .attr("transform", `translate(${legendX + legendWidth}, ${legendY})`)
    .call(legendAxis)
    .call((axisRoot) => {
      axisRoot.select(".domain").attr("stroke", "#7a8794");
      axisRoot.selectAll(".tick line").attr("stroke", "#7a8794");
      axisRoot
        .selectAll(".tick text")
        .attr("fill", "#2a3642")
        .attr("font-size", 11);
    });
};
