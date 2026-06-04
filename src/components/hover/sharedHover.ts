export type SharedHoverState =
  | {
      type: "cell";
      rowId: string;
      colId: string;
    }
  | {
      type: "node";
      nodeId: string;
    }
  | null;

type SharedHoverListener = (state: SharedHoverState) => void;
type SharedHoverSubscriptionOptions = {
  throttleMs?: number;
};

let currentHover: SharedHoverState = null;
let queuedHover: SharedHoverState = null;
let frameId: number | null = null;
const listeners = new Set<SharedHoverListener>();

const sameHoverState = (first: SharedHoverState, second: SharedHoverState) => {
  if (first === second) return true;
  if (!first || !second) return false;
  if (first.type !== second.type) return false;
  if (first.type === "cell" && second.type === "cell") {
    return first.rowId === second.rowId && first.colId === second.colId;
  }
  if (first.type === "node" && second.type === "node") {
    return first.nodeId === second.nodeId;
  }
  return false;
};

const notifyListeners = () => {
  frameId = null;
  const nextHover = queuedHover;
  queuedHover = null;
  if (sameHoverState(currentHover, nextHover)) return;

  currentHover = nextHover;
  listeners.forEach((listener) => listener(currentHover));
};

export const getSharedHoverState = () => currentHover;

export const setSharedHoverState = (nextHover: SharedHoverState) => {
  if (sameHoverState(currentHover, nextHover) && !frameId) return;

  queuedHover = nextHover;
  if (frameId) return;
  frameId = window.requestAnimationFrame(notifyListeners);
};

export const subscribeSharedHover = (
  listener: SharedHoverListener,
  options: SharedHoverSubscriptionOptions = {},
) => {
  const { throttleMs = 0 } = options;
  if (throttleMs <= 0) {
    listeners.add(listener);
    listener(currentHover);
    return () => {
      listeners.delete(listener);
    };
  }

  let timeoutId: number | null = null;
  let latestHover = currentHover;
  const throttledListener = (state: SharedHoverState) => {
    latestHover = state;
    if (timeoutId) return;
    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      listener(latestHover);
    }, throttleMs);
  };

  listeners.add(throttledListener);
  listener(currentHover);
  return () => {
    if (timeoutId) window.clearTimeout(timeoutId);
    listeners.delete(throttledListener);
  };
};
