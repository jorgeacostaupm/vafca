import { escapeHtml } from "@/utils/html";

export const formatHeatmapTooltipHtml = (
  rowLabel: string,
  colLabel: string,
  value: number,
  valueLabel = "Value",
) =>
  `<div><strong>${escapeHtml(
    `${rowLabel} ↔ ${colLabel}`,
  )}</strong></div><div>${escapeHtml(valueLabel)}: ${value.toFixed(4)}</div>`;

export const resolveHeatmapTooltipLabel = (
  labelId: string,
  labelNames?: Record<string, string>,
  labelTitles?: Record<string, string>,
) => labelTitles?.[labelId] ?? labelNames?.[labelId] ?? labelId;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const getTooltipPositionForMatrixCell = (args: {
  colX: number;
  rowY: number;
  bandwidthX: number;
  bandwidthY: number;
  matrixSize: number;
  margin: { left: number; top: number };
  tooltipRect: DOMRect;
  offset?: number;
}) => {
  const {
    colX,
    rowY,
    bandwidthX,
    bandwidthY,
    matrixSize,
    margin,
    tooltipRect,
    offset = 10,
  } = args;

  const matrixLeft = margin.left;
  const matrixTop = margin.top;
  const matrixCenterX = matrixLeft + matrixSize / 2;
  const matrixCenterY = matrixTop + matrixSize / 2;

  const cellCenterX = matrixLeft + colX + bandwidthX / 2;
  const cellCenterY = matrixTop + rowY + bandwidthY / 2;

  const rawLeft =
    cellCenterX < matrixCenterX
      ? matrixLeft + colX + bandwidthX + offset
      : matrixLeft + colX - tooltipRect.width - offset;
  const rawTop =
    cellCenterY < matrixCenterY
      ? matrixTop + rowY + bandwidthY + offset
      : matrixTop + rowY - tooltipRect.height - offset;

  const minLeft = matrixLeft;
  const maxLeft = Math.max(matrixLeft, matrixLeft + matrixSize - tooltipRect.width);
  const minTop = matrixTop;
  const maxTop = Math.max(matrixTop, matrixTop + matrixSize - tooltipRect.height);

  return {
    left: clamp(rawLeft, minLeft, maxLeft),
    top: clamp(rawTop, minTop, maxTop),
  };
};

export const getTooltipPositionForMatrixPointer = (args: {
  clientX: number;
  clientY: number;
  wrapperRect: DOMRect;
  tooltipRect: DOMRect;
  offset?: number;
}) => {
  const { clientX, clientY, wrapperRect, tooltipRect, offset = 10 } = args;
  const localX = clientX - wrapperRect.left;
  const localY = clientY - wrapperRect.top;
  const maxLeft = Math.max(0, wrapperRect.width - tooltipRect.width);
  const maxTop = Math.max(0, wrapperRect.height - tooltipRect.height);

  return {
    left: clamp(localX + offset, 0, maxLeft),
    top: clamp(localY + offset, 0, maxTop),
  };
};
