import { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  setHoveredRankingItem,
  setSelectedRankingItem,
} from "@/store/slices/rankings";
import {
  clearHoveredCell,
  clearHoveredNode,
  setHoveredCell,
  setHoveredNode,
} from "@/store/slices/visualizationUi";
import type { RankingHighlightItem, RankingRow } from "@/types/rankings";

export const getRankingHighlightItem = (
  row: RankingRow,
): RankingHighlightItem | undefined => {
  if (row.type === "matrix") return undefined;
  if (row.type === "roi") return { type: "roi", roiId: row.roiId };
  return {
    type: "link",
    sourceId: row.sourceId,
    targetId: row.targetId,
    endpointType: row.endpointType,
    matrixIds: row.valuesByMatrix ? Object.keys(row.valuesByMatrix) : undefined,
  };
};

export const useRankingRowInteractions = () => {
  const dispatch = useAppDispatch();

  const applySharedHover = useCallback(
    (item: RankingHighlightItem | undefined) => {
      if (!item) {
        dispatch(clearHoveredCell());
        dispatch(clearHoveredNode());
        return;
      }
      if (item.type === "link") {
        dispatch(setHoveredCell({ rowId: item.sourceId, colId: item.targetId }));
        dispatch(clearHoveredNode());
        return;
      }
      if (item.type === "roi") {
        dispatch(setHoveredNode(item.roiId));
        dispatch(clearHoveredCell());
      }
    },
    [dispatch],
  );

  const handleEnter = useCallback(
    (row: RankingRow) => {
      const item = getRankingHighlightItem(row);
      if (!item) return;
      dispatch(setHoveredRankingItem(item));
      applySharedHover(item);
    },
    [applySharedHover, dispatch],
  );

  const handleLeave = useCallback(() => {
    dispatch(setHoveredRankingItem(undefined));
    applySharedHover(undefined);
  }, [applySharedHover, dispatch]);

  const handleSelect = useCallback(
    (row: RankingRow) => {
      const item = getRankingHighlightItem(row);
      if (!item) return;
      dispatch(setSelectedRankingItem(item));
      applySharedHover(item);
    },
    [applySharedHover, dispatch],
  );

  return { handleEnter, handleLeave, handleSelect };
};
