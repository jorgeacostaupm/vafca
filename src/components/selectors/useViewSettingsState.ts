import type { ZoomableViewSettings, ZoomState } from "@/types/networkVisualization";

export const getZoomState = (settings?: ZoomableViewSettings): ZoomState => {
  const history = settings?.zoomHistory ?? [null];
  const index = Math.min(settings?.zoomIndex ?? 0, history.length - 1);
  return {
    history,
    index,
    current: history[index] ?? null,
  };
};
