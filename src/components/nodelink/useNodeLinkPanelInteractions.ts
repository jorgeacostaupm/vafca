import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addSelectedLink,
  clearHoveredCell,
  clearHoveredNode,
  removeSelectedLink,
  setHoveredCell,
  setHoveredNode,
} from "@/store/slices/visualizationUiSlice";

type UseNodeLinkPanelInteractionsArgs = {
  data: number[][];
  labels?: string[];
  compoundId: string;
  matrixLabel: string;
};

type SelectPayload = {
  rowId: string;
  colId: string;
  value: number;
  rowLabel: string;
  colLabel: string;
};

export const useNodeLinkPanelInteractions = ({
  data,
  labels,
  compoundId,
  matrixLabel,
}: UseNodeLinkPanelInteractionsArgs) => {
  const dispatch = useAppDispatch();
  const selectedLinks = useAppSelector((state) => state.visualizationUi.selectedLinks);
  const hoveredCell = useAppSelector((state) => state.visualizationUi.hoveredCell);
  const hoveredNodeId = useAppSelector((state) => state.visualizationUi.hoveredNodeId);

  const resolvedLabels = useMemo(() => {
    const count = data.length;
    if (labels?.length === count) return labels;
    return undefined;
  }, [data, labels]);

  const selectedLinkIds = useMemo(
    () => new Set(selectedLinks.map((link) => link.id)),
    [selectedLinks],
  );

  const handleSelect = useCallback(
    (payload: SelectPayload) => {
      const directId = `${payload.rowId}::${payload.colId}`;
      const reverseId = `${payload.colId}::${payload.rowId}`;
      const existing =
        selectedLinks.find((link) => link.id === directId) ??
        selectedLinks.find((link) => link.id === reverseId);
      if (existing) {
        dispatch(removeSelectedLink(existing.id));
        return;
      }
      dispatch(
        addSelectedLink({
          id: directId,
          rowId: payload.rowId,
          colId: payload.colId,
          rowLabel: payload.rowLabel,
          colLabel: payload.colLabel,
          sources: [
            {
              compoundId,
              matrixLabel,
              value: payload.value,
            },
          ],
        }),
      );
    },
    [dispatch, selectedLinks, compoundId, matrixLabel],
  );

  const handleLinkHover = useCallback(
    (payload: { rowId: string; colId: string }) => {
      dispatch(setHoveredCell({ rowId: payload.rowId, colId: payload.colId }));
      dispatch(clearHoveredNode());
    },
    [dispatch],
  );

  const handleLinkLeave = useCallback(() => {
    dispatch(clearHoveredCell());
  }, [dispatch]);

  const handleNodeHover = useCallback(
    (id: string) => {
      dispatch(setHoveredNode(id));
      dispatch(clearHoveredCell());
    },
    [dispatch],
  );

  const handleNodeLeave = useCallback(() => {
    dispatch(clearHoveredNode());
  }, [dispatch]);

  return {
    resolvedLabels,
    selectedLinkIds,
    hoveredCell,
    hoveredNodeId,
    handleSelect,
    handleLinkHover,
    handleLinkLeave,
    handleNodeHover,
    handleNodeLeave,
  };
};
