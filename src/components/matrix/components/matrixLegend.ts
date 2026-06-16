import * as d3 from "d3";

import type { HeatmapLegendRange } from "@/components/matrix/components/matrixTypes";
import { createMatrixColorResolver } from "@/config/matrixColorScales";
import {
  MATRIX_COLOR_LEGEND_THICKNESS,
  MATRIX_COLOR_LEGEND_VERTICAL_OFFSET,
} from "@/config/ui";
import type { ScaleType } from "@/types/network";
import type { MatrixColorScaleSettings } from "@/types/visualizationUi";

type HeatmapLegendOrientation = "vertical" | "horizontal";

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

const normalizeDiscreteSteps = (steps?: number | null) => {
  if (!Number.isFinite(steps) || !steps || steps <= 1) return null;
  return Math.max(2, Math.round(steps));
};

const buildDiscreteBoundaryTicks = (
  legendRange: HeatmapLegendRange,
  steps: number,
) => {
  const { min, max } = legendRange;
  return uniqueSortedTicks(
    d3.range(0, steps + 1).map((index) => {
      const t = index / steps;
      return min + (max - min) * t;
    }),
  );
};

const buildLegendTicks = (
  legendRange: HeatmapLegendRange,
  discreteSteps?: number | null,
) => {
  const normalizedDiscreteSteps = normalizeDiscreteSteps(discreteSteps);
  if (normalizedDiscreteSteps) {
    return buildDiscreteBoundaryTicks(legendRange, normalizedDiscreteSteps);
  }

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

export const createHeatmapColorResolver = (args: {
  legendRange: HeatmapLegendRange;
  scaleType: ScaleType;
  scaleCenter: number | null;
  colorScaleSettings: MatrixColorScaleSettings;
}) =>
  createMatrixColorResolver({
    type: args.scaleType,
    domain: {
      min: args.legendRange.min,
      max: args.legendRange.max,
      center: args.scaleCenter,
    },
    settings: args.colorScaleSettings,
  });

export const renderHeatmapLegend = (args: {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  length: number;
  legendRange: HeatmapLegendRange;
  colorResolver: (value: number) => string;
  discreteSteps?: number | null;
  orientation?: HeatmapLegendOrientation;
  thickness?: number;
  origin?: { x: number; y: number };
  plotOffset?: number;
  gradientId?: string;
}) => {
  const {
    svg,
    root,
    length,
    legendRange,
    colorResolver,
    discreteSteps,
    orientation = "vertical",
    thickness = MATRIX_COLOR_LEGEND_THICKNESS,
    origin = { x: 0, y: 0 },
    plotOffset = orientation === "vertical" ? MATRIX_COLOR_LEGEND_VERTICAL_OFFSET : 0,
    gradientId,
  } = args;

  const legendLength = Math.max(length, 0);
  const legendThickness = Math.max(thickness, 1);
  const isHorizontal = orientation === "horizontal";
  const legendWidth = isHorizontal ? legendLength : legendThickness;
  const legendHeight = isHorizontal ? legendThickness : legendLength;
  const legendX = origin.x + (isHorizontal ? 0 : legendLength + plotOffset);
  const legendY = origin.y;

  const legendScale = d3
    .scaleLinear()
    .domain([legendRange.min, legendRange.max])
    .range(isHorizontal ? [0, legendWidth] : [legendHeight, 0]);
  const normalizedDiscreteSteps = normalizeDiscreteSteps(discreteSteps);

  const legendAxis = (isHorizontal
    ? d3.axisBottom(legendScale)
    : d3.axisRight(legendScale))
    .tickValues(buildLegendTicks(legendRange, normalizedDiscreteSteps))
    .tickFormat(buildLegendTickFormatter(legendRange));

  const legendGradientId =
    gradientId ?? `legend-${Math.random().toString(36).slice(2)}`;
  const defs = svg.append("defs");
  const linearGradient = defs
    .append("linearGradient")
    .attr("id", legendGradientId)
    .attr("x1", isHorizontal ? "0%" : "0%")
    .attr("y1", isHorizontal ? "0%" : "100%")
    .attr("x2", isHorizontal ? "100%" : "0%")
    .attr("y2", isHorizontal ? "0%" : "0%");

  const addStop = (offset: number, value: number) => {
    linearGradient
      .append("stop")
      .attr("offset", `${offset * 100}%`)
      .attr("stop-color", colorResolver(value));
  };

  if (normalizedDiscreteSteps) {
    d3.range(0, normalizedDiscreteSteps).forEach((index) => {
      const start = index / normalizedDiscreteSteps;
      const end = (index + 1) / normalizedDiscreteSteps;
      const mid = (index + 0.5) / normalizedDiscreteSteps;
      const value = legendRange.min + (legendRange.max - legendRange.min) * mid;
      addStop(start, value);
      addStop(end, value);
    });
  } else {
    d3.range(0, 1.01, 0.1).forEach((stop) => {
      const value = legendRange.min + (legendRange.max - legendRange.min) * stop;
      addStop(stop, value);
    });
  }

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
    .attr(
      "transform",
      isHorizontal
        ? `translate(${legendX}, ${legendY + legendHeight})`
        : `translate(${legendX + legendWidth}, ${legendY})`,
    )
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
