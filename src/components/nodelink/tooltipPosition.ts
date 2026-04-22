const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type PositionArgs = {
  rawLeft: number;
  rawTop: number;
  wrapperRect: DOMRect;
  tooltipRect: DOMRect;
  offset: number;
};

const computeBoundedPosition = ({
  rawLeft,
  rawTop,
  wrapperRect,
  tooltipRect,
  offset,
}: PositionArgs) => {
  const minLeft = offset;
  const minTop = offset;
  const maxLeft = Math.max(
    minLeft,
    wrapperRect.width - tooltipRect.width - offset,
  );
  const maxTop = Math.max(
    minTop,
    wrapperRect.height - tooltipRect.height - offset,
  );
  return {
    left: clamp(rawLeft, minLeft, maxLeft),
    top: clamp(rawTop, minTop, maxTop),
  };
};

export const positionTooltipForPointer = (args: {
  event: MouseEvent | PointerEvent;
  wrapperRect: DOMRect;
  tooltipRect: DOMRect;
  offset: number;
}) => {
  const { event, wrapperRect, tooltipRect, offset } = args;
  return computeBoundedPosition({
    rawLeft: event.clientX - wrapperRect.left + offset,
    rawTop: event.clientY - wrapperRect.top + offset,
    wrapperRect,
    tooltipRect,
    offset,
  });
};

export const positionTooltipForCoordinates = (args: {
  x: number;
  y: number;
  wrapperRect: DOMRect;
  tooltipRect: DOMRect;
  offset: number;
}) => {
  const { x, y, wrapperRect, tooltipRect, offset } = args;
  return computeBoundedPosition({
    rawLeft: x + offset,
    rawTop: y + offset,
    wrapperRect,
    tooltipRect,
    offset,
  });
};
