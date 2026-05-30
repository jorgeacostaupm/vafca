const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type CircularTooltipPositionArgs = {
  anchorX: number;
  anchorY: number;
  centerX: number;
  centerY: number;
  wrapperRect: DOMRect;
  tooltipRect: DOMRect;
  offset: number;
  edgePadding: number;
};

type TooltipCandidate = {
  left: number;
  top: number;
};

const getOverflowScore = (
  candidate: TooltipCandidate,
  wrapperRect: DOMRect,
  tooltipRect: DOMRect,
  edgePadding: number,
) => {
  const overflowLeft = Math.max(edgePadding - candidate.left, 0);
  const overflowTop = Math.max(edgePadding - candidate.top, 0);
  const overflowRight = Math.max(
    candidate.left + tooltipRect.width + edgePadding - wrapperRect.width,
    0,
  );
  const overflowBottom = Math.max(
    candidate.top + tooltipRect.height + edgePadding - wrapperRect.height,
    0,
  );

  return overflowLeft + overflowTop + overflowRight + overflowBottom;
};

export const positionCircularTooltipForNode = ({
  anchorX,
  anchorY,
  centerX,
  centerY,
  wrapperRect,
  tooltipRect,
  offset,
  edgePadding,
}: CircularTooltipPositionArgs) => {
  const placeRight = anchorX >= centerX;
  const placeBottom = anchorY >= centerY;
  const horizontalCandidate = {
    left: placeRight ? anchorX + offset : anchorX - tooltipRect.width - offset,
    top: anchorY - tooltipRect.height / 2,
  };
  const verticalCandidate = {
    left: anchorX - tooltipRect.width / 2,
    top: placeBottom ? anchorY + offset : anchorY - tooltipRect.height - offset,
  };
  const candidates = [horizontalCandidate, verticalCandidate];
  const bestCandidate = candidates.reduce((best, candidate) =>
    getOverflowScore(candidate, wrapperRect, tooltipRect, edgePadding) <
    getOverflowScore(best, wrapperRect, tooltipRect, edgePadding)
      ? candidate
      : best,
  );
  const maxLeft = Math.max(edgePadding, wrapperRect.width - tooltipRect.width - edgePadding);
  const maxTop = Math.max(edgePadding, wrapperRect.height - tooltipRect.height - edgePadding);

  return {
    left: clamp(bestCandidate.left, edgePadding, maxLeft),
    top: clamp(bestCandidate.top, edgePadding, maxTop),
  };
};
