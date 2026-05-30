import { useCallback, useMemo } from "react";
import type { LayoutItem } from "react-grid-layout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeNetworkView } from "@/store/slices/networkVisualization";
import {
  removeNetworkLayoutItem,
  setNetworkLayout,
} from "@/store/slices/networkLayout";
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

export const useNetworkWorkspaceLayout = () => {
  const dispatch = useAppDispatch();
  const networkLayout = useAppSelector((state) => state.networkLayout.layout);
  const rankingLayout = useAppSelector((state) => state.rankings.layout);
  const networkViewsById = useAppSelector(
    (state) => state.networkVisualization.viewsById,
  );
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

  const removePanel = useCallback(
    (id: string) => {
      if (networkViewsById[id]) {
        dispatch(removeNetworkView({ viewId: id }));
        dispatch(removeNetworkLayoutItem({ viewId: id }));
        return;
      }
      dispatch(removeRankingResult({ resultId: id }));
    },
    [dispatch, networkViewsById],
  );

  const updateLayout = useCallback(
    (nextLayout: LayoutItem[]) => {
      const networkIds = new Set(networkViewsOrder);
      const rankingIds = new Set(rankingResultsOrder);
      const nextNetworkLayout = nextLayout
        .filter((entry) => networkIds.has(entry.i))
        .map(toStoredLayoutItem);
      const nextRankingLayout = nextLayout
        .filter((entry) => rankingIds.has(entry.i))
        .map(toStoredLayoutItem);

      dispatch(setNetworkLayout(nextNetworkLayout));
      dispatch(setRankingLayout(nextRankingLayout));
    },
    [dispatch, networkViewsOrder, rankingResultsOrder],
  );

  return {
    panelIds,
    combinedLayout,
    removePanel,
    updateLayout,
    isNetworkView: (id: string) => Boolean(networkViewsById[id]),
  };
};
