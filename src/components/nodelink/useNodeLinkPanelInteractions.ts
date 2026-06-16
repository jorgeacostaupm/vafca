import { useCallback, useMemo } from "react";

import { setSharedHoverState } from "@/components/hover/sharedHover";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addSelectedLink,
  addSelectedLinks,
  removeSelectedLink,
  removeSelectedLinks,
} from "@/store/slices/visualizationUi";
import type { NodeLinkBrushLink } from "@/types/nodelink";
import type { SelectedLink } from "@/types/visualizationUi";

type UseNodeLinkPanelInteractionsArgs = {
  data: number[][];
  labels?: string[];
  compoundId: string;
  networkLabel: string;
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
  networkLabel,
}: UseNodeLinkPanelInteractionsArgs) => {
  const dispatch = useAppDispatch();
  const selectedLinks = useAppSelector((state) => state.visualizationUi.selectedLinks);

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
              networkLabel,
              value: payload.value,
            },
          ],
        }),
      );
    },
    [dispatch, selectedLinks, compoundId, networkLabel],
  );

  const handleLinkHover = useCallback(
    (payload: { rowId: string; colId: string }) => {
      setSharedHoverState({
        type: "cell",
        rowId: payload.rowId,
        colId: payload.colId,
      });
    },
    [],
  );

  const handleLinkLeave = useCallback(() => {
    setSharedHoverState(null);
  }, []);

  const handleNodeHover = useCallback(
    (id: string) => {
      setSharedHoverState({ type: "node", nodeId: id });
    },
    [],
  );

  const handleNodeLeave = useCallback(() => {
    setSharedHoverState(null);
  }, []);

  const handleBrushSelectLinks = useCallback(
    (payload: { links: NodeLinkBrushLink[] }) => {
      const selectedIds = new Set(selectedLinks.map((link) => link.id));
      const links: SelectedLink[] = [];

      payload.links.forEach((link) => {
        const directId = `${link.rowId}::${link.colId}`;
        const reverseId = `${link.colId}::${link.rowId}`;
        if (selectedIds.has(directId) || selectedIds.has(reverseId)) return;

        selectedIds.add(directId);
        links.push({
          id: directId,
          rowId: link.rowId,
          colId: link.colId,
          rowLabel: link.rowLabel,
          colLabel: link.colLabel,
          sources: [
            {
              compoundId,
              networkLabel,
              value: link.value,
            },
          ],
        });
      });

      if (links.length > 0) {
        dispatch(addSelectedLinks(links));
      }
    },
    [compoundId, dispatch, networkLabel, selectedLinks],
  );

  const handleBrushDeselectLinks = useCallback(
    (payload: { links: NodeLinkBrushLink[] }) => {
      const ids = payload.links.flatMap((link) => [
        `${link.rowId}::${link.colId}`,
        `${link.colId}::${link.rowId}`,
      ]);
      if (ids.length > 0) {
        dispatch(removeSelectedLinks(ids));
      }
    },
    [dispatch],
  );

  return {
    resolvedLabels,
    selectedLinkIds,
    handleSelect,
    handleLinkHover,
    handleLinkLeave,
    handleNodeHover,
    handleNodeLeave,
    handleBrushSelectLinks,
    handleBrushDeselectLinks,
  };
};
