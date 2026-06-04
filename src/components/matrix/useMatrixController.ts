import { useCallback, useMemo } from "react";

import { setSharedHoverState } from "@/components/hover/sharedHover";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addSelectedLink,
  addSelectedLinks,
  removeSelectedLink,
  removeSelectedLinks,
} from "@/store/slices/visualizationUi";
import type { MatrixBrushPayload } from "@/types/matrixHeatmap";
import type { SelectedLink } from "@/types/visualizationUi";
import {
  createSelectedLinkDraft,
  getSelectedLinkRemovalIds,
} from "@/utils/selectedLinkKeys";

type UseMatrixHeatmapControllerArgs = {
  data: number[][];
  labels?: string[];
  rowLabels?: string[];
  colLabels?: string[];
  labelNames?: Record<string, string>;
  compoundId: string;
  matrixLabel: string;
  symmetric: boolean;
};

type CellPayload = {
  row: number;
  col: number;
  value: number;
  rowId: string;
  colId: string;
  rowLabel: string;
  colLabel: string;
};

export const useMatrixHeatmapController = ({
  data,
  labels,
  rowLabels,
  colLabels,
  labelNames,
  compoundId,
  matrixLabel,
  symmetric,
}: UseMatrixHeatmapControllerArgs) => {
  const dispatch = useAppDispatch();
  const selectedLinks = useAppSelector((state) => state.visualizationUi.selectedLinks);

  const resolvedRowLabels = useMemo(() => {
    const rows = data.length;
    if (rowLabels?.length === rows) return rowLabels;
    if (labels?.length === rows) return labels;
    return undefined;
  }, [data, rowLabels, labels]);

  const resolvedColLabels = useMemo(() => {
    const cols = data[0]?.length ?? 0;
    if (colLabels?.length === cols) return colLabels;
    if (labels?.length === cols) return labels;
    return undefined;
  }, [data, colLabels, labels]);

  const labelIndexById = useMemo(() => {
    const indexById = new Map<string, number>();
    [...(resolvedRowLabels ?? []), ...(resolvedColLabels ?? [])].forEach((id) => {
      if (!indexById.has(id)) indexById.set(id, indexById.size);
    });
    return indexById;
  }, [resolvedRowLabels, resolvedColLabels]);

  const selectedCells = useMemo(() => {
    if (!resolvedRowLabels || !resolvedColLabels) return [];
    const rowIndexById = new Map(resolvedRowLabels.map((id, index) => [id, index]));
    const colIndexById = new Map(resolvedColLabels.map((id, index) => [id, index]));
    const colCount = resolvedColLabels.length;
    const next: Array<{ row: number; col: number }> = [];
    const seen = new Set<number>();
    const addCell = (row?: number, col?: number) => {
      if (row === undefined || col === undefined) return;
      const key = row * colCount + col;
      if (seen.has(key)) return;
      seen.add(key);
      next.push({ row, col });
    };
    selectedLinks.forEach((link: SelectedLink) => {
      const row = rowIndexById.get(link.rowId);
      const col = colIndexById.get(link.colId);
      addCell(row, col);
    });
    return next;
  }, [selectedLinks, resolvedRowLabels, resolvedColLabels]);

  const handleHover = useCallback(
    (payload: CellPayload) => {
      setSharedHoverState({
        type: "cell",
        rowId: payload.rowId,
        colId: payload.colId,
      });
    },
    [],
  );

  const handleLeave = useCallback(() => {
    setSharedHoverState(null);
  }, []);

  const handleLabelHover = useCallback((labelId: string) => {
    setSharedHoverState({ type: "node", nodeId: labelId });
  }, []);

  const handleSelect = useCallback(
    (payload: CellPayload) => {
      const rowLabel = labelNames?.[payload.rowId] ?? payload.rowLabel;
      const colLabel = labelNames?.[payload.colId] ?? payload.colLabel;
      const draft = createSelectedLinkDraft({
        row: {
          id: payload.rowId,
          label: rowLabel,
          index: labelIndexById.get(payload.rowId),
        },
        col: {
          id: payload.colId,
          label: colLabel,
          index: labelIndexById.get(payload.colId),
        },
        symmetric,
      });
      const removalIds = getSelectedLinkRemovalIds(
        payload.rowId,
        payload.colId,
        symmetric,
      );
      const existing = selectedLinks.find((link) => removalIds.includes(link.id));
      if (existing) {
        dispatch(removeSelectedLink(existing.id));
        return;
      }
      dispatch(
        addSelectedLink({
          ...draft,
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
    [
      compoundId,
      dispatch,
      labelIndexById,
      labelNames,
      matrixLabel,
      selectedLinks,
      symmetric,
    ],
  );

  const handleBrushSelectLinks = useCallback(
    (payload: MatrixBrushPayload) => {
      const selectedIds = new Set(selectedLinks.map((link) => link.id));
      const links: SelectedLink[] = [];

      payload.cells.forEach((cell) => {
        const rowId = cell.rowLabel;
        const rowLabel = labelNames?.[rowId] ?? rowId;
        const colId = cell.colLabel;
        const draft = createSelectedLinkDraft({
          row: {
            id: rowId,
            label: rowLabel,
            index: labelIndexById.get(rowId),
          },
          col: {
            id: colId,
            label: labelNames?.[colId] ?? colId,
            index: labelIndexById.get(colId),
          },
          symmetric,
        });
        const removalIds = getSelectedLinkRemovalIds(rowId, colId, symmetric);
        if (removalIds.some((id) => selectedIds.has(id))) return;

        selectedIds.add(draft.id);
        links.push({
          ...draft,
          sources: [
            {
              compoundId,
              matrixLabel,
              value: cell.value,
            },
          ],
        });
      });

      if (links.length > 0) {
        dispatch(addSelectedLinks(links));
      }
    },
    [
      compoundId,
      dispatch,
      labelIndexById,
      labelNames,
      matrixLabel,
      selectedLinks,
      symmetric,
    ],
  );

  const handleBrushDeselectLinks = useCallback(
    (payload: MatrixBrushPayload) => {
      const ids = payload.cells.flatMap((cell) =>
        getSelectedLinkRemovalIds(cell.rowLabel, cell.colLabel, symmetric),
      );

      if (ids.length > 0) {
        dispatch(removeSelectedLinks(ids));
      }
    },
    [dispatch, symmetric],
  );

  return {
    selectedCells,
    handleHover,
    handleLeave,
    handleLabelHover,
    handleSelect,
    handleBrushSelectLinks,
    handleBrushDeselectLinks,
  };
};
