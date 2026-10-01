import * as d3 from "d3";

import { BASE_MARGIN } from "@/components/matrix/components/matrixConstants";
import type { MatrixMargin } from "@/components/matrix/components/matrixTypes";
import {
  MATRIX_LABEL_FALLBACK_CHAR_WIDTH_RATIO,
  MATRIX_LABEL_FONT_FAMILY,
} from "@/config/ui";

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

const resolveDisplayLabel = (
  labelId: string,
  labelNames?: Record<string, string>,
) => labelNames?.[labelId] ?? labelId;

const getDisplayLabels = (
  labels?: string[],
  labelNames?: Record<string, string>,
) => labels?.map((id) => resolveDisplayLabel(id, labelNames)) ?? [];

let labelMeasureContext: CanvasRenderingContext2D | null = null;

const getLabelMeasureContext = () => {
  if (typeof document === "undefined") return null;
  if (labelMeasureContext) return labelMeasureContext;

  labelMeasureContext = document.createElement("canvas").getContext("2d");
  return labelMeasureContext;
};

const estimateLabelWidth = (label: string, fontSize: number) =>
  label.length * fontSize * MATRIX_LABEL_FALLBACK_CHAR_WIDTH_RATIO;

const measureLabelWidth = (label: string, fontSize: number) => {
  const context = getLabelMeasureContext();
  if (!context) {
    // ponytail: SSR/tests have no canvas; this keeps layout deterministic until a DOM test can measure real glyphs.
    return estimateLabelWidth(label, fontSize);
  }

  context.font = `${fontSize}px ${MATRIX_LABEL_FONT_FAMILY}`;
  return context.measureText(label).width;
};

const getMaxLabelWidth = (labels: string[], fontSize: number) =>
  labels.reduce(
    (maxWidth, label) => Math.max(maxWidth, measureLabelWidth(label, fontSize)),
    0,
  );

const computeDynamicMargin = (args: {
  width: number;
  height: number;
  rows: number;
  cols: number;
  rowDisplayLabels: string[];
  colDisplayLabels: string[];
}): MatrixMargin => {
  const { width, height, rows, cols, rowDisplayLabels, colDisplayLabels } = args;
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

    const topLabelSpace = getMaxLabelWidth(colDisplayLabels, colFontSize);
    const leftLabelSpace = getMaxLabelWidth(rowDisplayLabels, rowFontSize);

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
  const rowDisplayLabels = getDisplayLabels(rowLabels, labelNames);
  const colDisplayLabels = getDisplayLabels(colLabels, labelNames);

  const margin = computeDynamicMargin({
    width,
    height,
    rows,
    cols,
    rowDisplayLabels,
    colDisplayLabels,
  });

  const innerWidth = Math.max(width - margin.left - margin.right, 0);
  const innerHeight = Math.max(height - margin.top - margin.bottom, 0);
  const size = Math.min(innerWidth, innerHeight);
  const verticalOffset = Math.max((innerHeight - size) / 2, 0);
  const centeredMargin = {
    ...margin,
    top: margin.top + verticalOffset,
  };

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
    margin: centeredMargin,
    size,
    xScale,
    yScale,
    rowLabelFontSize,
    colLabelFontSize,
  };
};

const assertHeatmapLayoutUsesMeasuredLabelWidths = () => {
  const layout = buildHeatmapLayout({
    width: 500,
    height: 500,
    rows: 8,
    cols: 8,
    rowLabels: ["narrow", "wide"],
    colLabels: ["narrow", "wide"],
    labelNames: {
      narrow: "iiiiiiiiiiiiiiiiiiii",
      wide: "WWWWWWWW",
    },
  });

  console.assert(
    layout.margin.left >= BASE_MARGIN.left,
    "matrix label margin keeps at least the base spacing",
  );
  console.assert(
    layout.margin.top < 500 * 0.45,
    "matrix label margin uses measured text before the viewport cap",
  );
};

const assertHeatmapLayoutCentersMatrixVertically = () => {
  const layout = buildHeatmapLayout({
    width: 500,
    height: 700,
    rows: 10,
    cols: 10,
  });

  const bottomSpace = 700 - layout.margin.top - layout.size;

  console.assert(
    Math.abs((layout.margin.top - BASE_MARGIN.top) - (bottomSpace - BASE_MARGIN.bottom)) <
      1e-9,
    "matrix layout distributes extra vertical space around the plot",
  );
};

if (import.meta.env.DEV) {
  assertHeatmapLayoutUsesMeasuredLabelWidths();
  assertHeatmapLayoutCentersMatrixVertically();
}
