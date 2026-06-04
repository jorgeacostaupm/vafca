import { useCallback, useMemo } from "react";
import type { LayoutItem } from "react-grid-layout";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeNetworkLayoutItem,
  setNetworkLayout,
} from "@/store/slices/networkLayout";
import { removeNetworkView } from "@/store/slices/networkVisualization";
import {
  removeRankingResult,
  setRankingLayout,
} from "@/store/slices/rankings";

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
  const networkLayout = useAppSelector((state) => state.networkLayout.layout);
  const rankingLayout = useAppSelector((state) => state.rankings.layout);
  const networkViewsOrder = useAppSelector(
    (state) => state.networkVisualization.viewsOrder,
  );
  const rankingResultsOrder = useAppSelector(
    (state) => state.rankings.resultsOrder,
  );

  const combinedLayout = useMemo(
    () => [...networkLayout, ...rankingLayout],
    [networkLayout, rankingLayout],
  );
  const panelIds = useMemo(
    () => [...networkViewsOrder, ...rankingResultsOrder],
    [networkViewsOrder, rankingResultsOrder],
  );
  const networkIds = useMemo(() => new Set(networkViewsOrder), [networkViewsOrder]);
  const rankingIds = useMemo(
    () => new Set(rankingResultsOrder),
    [rankingResultsOrder],
  );

  const removePanel = useCallback(
    (id: string) => {
      if (networkIds.has(id)) {
        dispatch(removeNetworkView({ viewId: id }));
        dispatch(removeNetworkLayoutItem({ viewId: id }));
        return;
      }
      dispatch(removeRankingResult({ resultId: id }));
    },
    [dispatch, networkIds],
  );

  const updateLayout = useCallback(
    (nextLayout: LayoutItem[]) => {
      const nextNetworkLayout = nextLayout
        .filter((entry) => networkIds.has(entry.i))
        .map(toStoredLayoutItem);
      const nextRankingLayout = nextLayout
        .filter((entry) => rankingIds.has(entry.i))
        .map(toStoredLayoutItem);

      if (!areLayoutItemsEqual(networkLayout, nextNetworkLayout)) {
        dispatch(setNetworkLayout(nextNetworkLayout));
      }
      if (!areLayoutItemsEqual(rankingLayout, nextRankingLayout)) {
        dispatch(setRankingLayout(nextRankingLayout));
      }
    },
    [dispatch, networkIds, networkLayout, rankingIds, rankingLayout],
  );
  const isNetworkView = useCallback((id: string) => networkIds.has(id), [networkIds]);

  return {
    panelIds,
    combinedLayout,
    removePanel,
    updateLayout,
    isNetworkView,
  };
};
