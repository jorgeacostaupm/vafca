import { useCallback, useMemo } from "react";
import type { LayoutItem } from "react-grid-layout";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeNetworkLayoutItem,
  setNetworkLayout,
} from "@/store/slices/networkLayout";
import { removeNetworkView } from "@/store/slices/networkVisualization";
import { removeRankingResult } from "@/store/slices/rankings";

const toStoredLayoutItem = ({ i, x, y, w, h }: LayoutItem) => ({
  i,
  x,
  y,
  w,
  h,
});

type StoredLayoutItem = ReturnType<typeof toStoredLayoutItem>;

const areLayoutItemsEqual = (
  current: StoredLayoutItem[],
  next: StoredLayoutItem[],
) =>
  current.length === next.length &&
  current.every((item, index) => {
    const nextItem = next[index];
    return (
      nextItem &&
      item.i === nextItem.i &&
      item.x === nextItem.x &&
      item.y === nextItem.y &&
      item.w === nextItem.w &&
      item.h === nextItem.h
    );
  });

export const useNetworkWorkspaceLayout = () => {
  const dispatch = useAppDispatch();
  const layout = useAppSelector((state) => state.networkLayout.layout);
  const networkViewsOrder = useAppSelector(
    (state) => state.networkVisualization.viewsOrder,
  );
  const rankingResultsOrder = useAppSelector(
    (state) => state.rankings.resultsOrder,
  );

  const panelIds = useMemo(
    () => [...networkViewsOrder, ...rankingResultsOrder],
    [networkViewsOrder, rankingResultsOrder],
  );
  const networkIds = useMemo(() => new Set(networkViewsOrder), [networkViewsOrder]);

  const removePanel = useCallback(
    (id: string) => {
      if (networkIds.has(id)) {
        dispatch(removeNetworkView({ viewId: id }));
      } else {
        dispatch(removeRankingResult({ resultId: id }));
      }
      dispatch(removeNetworkLayoutItem({ viewId: id }));
    },
    [dispatch, networkIds],
  );

  const updateLayout = useCallback(
    (nextLayout: LayoutItem[]) => {
      const visibleIds = new Set(panelIds);
      const nextStoredLayout = nextLayout
        .filter((entry) => visibleIds.has(entry.i))
        .map(toStoredLayoutItem);

      if (!areLayoutItemsEqual(layout, nextStoredLayout)) {
        dispatch(setNetworkLayout(nextStoredLayout));
      }
    },
    [dispatch, layout, panelIds],
  );
  const isNetworkView = useCallback((id: string) => networkIds.has(id), [networkIds]);

  return {
    panelIds,
    combinedLayout: layout,
    removePanel,
    updateLayout,
    isNetworkView,
  };
};
