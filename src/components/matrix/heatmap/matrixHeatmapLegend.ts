import * as d3 from "d3";
import type { HeatmapLegendRange } from "@/components/matrix/heatmap/matrixHeatmapTypes";

export const createHeatmapColorResolver = (legendRange: HeatmapLegendRange) => {
  const isDiverging = legendRange.min < 0 && legendRange.max > 0;

  if (isDiverging) {
    const diverging = d3
      .scaleDiverging(d3.interpolateRdBu)
      .domain([legendRange.min, 0, legendRange.max])
      .clamp(true);
    return (value: number) => diverging(value);
  }

  const sequential = d3
    .scaleSequential(d3.interpolateYlGnBu)
    .domain([legendRange.min, legendRange.max])
    .clamp(true);

  return (value: number) => sequential(value);
};

export const renderHeatmapLegend = (args: {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  size: number;
  legendRange: HeatmapLegendRange;
  colorResolver: (value: number) => string;
}) => {
  const { svg, root, size, legendRange, colorResolver } = args;

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
    const value = legendRange.min + (legendRange.max - legendRange.min) * stop;
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
    .attr("transform", `translate(${legendX + legendWidth}, ${legendY})`)
    .call(legendAxis);
};
