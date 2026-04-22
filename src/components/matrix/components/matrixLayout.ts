import * as d3 from "d3";
import { BASE_MARGIN } from "@/components/matrix/components/matrixConstants";
import type { MatrixMargin } from "@/components/matrix/components/matrixTypes";

type BuildHeatmapLayoutArgs = {
  width: number;
  height: number;
  rows: number;
  cols: number;
  rowLabels?: string[];
  colLabels?: string[];
  labelNames?: Record<string, string>;
};

export type HeatmapLayout = {
  margin: MatrixMargin;
  size: number;
  xScale: d3.ScaleBand<number>;
  yScale: d3.ScaleBand<number>;
  rowLabelFontSize: number;
  colLabelFontSize: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const estimateLabelWidth = (charCount: number, fontSize: number) =>
  charCount * fontSize * 0.58;

const resolveDisplayLabel = (
  labelId: string,
  labelNames?: Record<string, string>,
) => labelNames?.[labelId] ?? labelId;

const getMaxLabelCharCount = (
  labels?: string[],
  labelNames?: Record<string, string>,
) => {
  if (!labels?.length) return 0;
  return labels.reduce((acc, id) => {
    const label = resolveDisplayLabel(id, labelNames);
    return Math.max(acc, label.length);
  }, 0);
};

const computeDynamicMargin = (args: {
  width: number;
  height: number;
  rows: number;
  cols: number;
  maxRowCharsWidth: number;
  maxColCharsWidth: number;
}): MatrixMargin => {
  const { width, height, rows, cols, maxRowCharsWidth, maxColCharsWidth } = args;
  const dynamicMargin: MatrixMargin = { ...BASE_MARGIN };

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const innerWidth = Math.max(width - dynamicMargin.left - dynamicMargin.right, 0);
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

  return dynamicMargin;
};

export const buildHeatmapLayout = ({
  width,
  height,
  rows,
  cols,
  rowLabels,
  colLabels,
  labelNames,
}: BuildHeatmapLayoutArgs): HeatmapLayout => {
  const maxRowCharsWidth = getMaxLabelCharCount(rowLabels, labelNames);
  const maxColCharsWidth = getMaxLabelCharCount(colLabels, labelNames);

  const margin = computeDynamicMargin({
    width,
    height,
    rows,
    cols,
    maxRowCharsWidth,
    maxColCharsWidth,
  });

  const innerWidth = Math.max(width - margin.left - margin.right, 0);
  const innerHeight = Math.max(height - margin.top - margin.bottom, 0);
  const size = Math.min(innerWidth, innerHeight);

  const xScale = d3
    .scaleBand<number>()
    .domain(d3.range(cols))
    .range([0, size]);

  const yScale = d3
    .scaleBand<number>()
    .domain(d3.range(rows))
    .range([0, size]);

  const rowLabelFontSize = clamp(yScale.bandwidth() * 0.56, 8, 16);
  const colLabelFontSize = clamp(xScale.bandwidth() * 0.56, 8, 16);

  return {
    margin,
    size,
    xScale,
    yScale,
    rowLabelFontSize,
    colLabelFontSize,
  };
};
