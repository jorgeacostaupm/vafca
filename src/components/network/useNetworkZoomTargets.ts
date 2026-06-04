import { useCallback } from "react";

import { useAppSelector } from "@/store/hooks";
import type { NetworkViewDescriptor } from "@/types/networkVisualization";

export const useNetworkZoomTargets = () => {
  const syncZoom = useAppSelector(
    (state) => state.networkVisualization.controls.syncZoom,
  );
  const viewsById = useAppSelector(
    (state) => state.networkVisualization.viewsById,
  );
  const viewsOrder = useAppSelector(
    (state) => state.networkVisualization.viewsOrder,
  );

  return useCallback(
    (viewId: string) => {
      if (!syncZoom) return [viewId];

      const trigger = viewsById[viewId];
      if (!trigger) return [viewId];

      const views = viewsOrder
        .map((id) => viewsById[id])
        .filter((view): view is NetworkViewDescriptor => Boolean(view));
      const isMatrix = trigger.type === "matrix";

      return views
        .filter((view) =>
          isMatrix ? view.type === "matrix" : view.type !== "matrix",
        )
        .map((view) => view.id);
    },
    [syncZoom, viewsById, viewsOrder],
  );
};
