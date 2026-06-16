import { useCallback } from "react";

import { setSharedHoverState } from "@/components/hover/sharedHover";
import { useAppDispatch } from "@/store/hooks";
import {
  setHoveredRankingItem,
  setSelectedRankingItem,
} from "@/store/slices/rankings";
import type { RankingHighlightItem, RankingRow } from "@/types/rankings";

export const getRankingHighlightItem = (
  row: RankingRow,
): RankingHighlightItem | undefined => {
  if (row.type === "network") return undefined;
  if (row.type === "node") return { type: "node", nodeId: row.nodeId };
  return {
    type: "link",
    sourceId: row.sourceId,
    targetId: row.targetId,
    endpointType: row.endpointType,
    networkIds: row.valuesByNetwork ? Object.keys(row.valuesByNetwork) : undefined,
  };
};

export const useRankingRowInteractions = () => {
  const dispatch = useAppDispatch();

  const applySharedHover = useCallback(
    (item: RankingHighlightItem | undefined) => {
      if (!item) {
        setSharedHoverState(null);
        return;
      }
      if (item.type === "link") {
        setSharedHoverState({
          type: "cell",
          rowId: item.sourceId,
          colId: item.targetId,
        });
        return;
      }
      if (item.type === "node") {
        setSharedHoverState({ type: "node", nodeId: item.nodeId });
      }
    },
    [],
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
