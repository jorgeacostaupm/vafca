import { useCallback, useEffect, useMemo, useRef } from "react";

import { setSharedHoverState } from "@/components/hover/sharedHover";
import {
  MATRIX_BRUSH_LINK_DISPATCH_CHUNK_SIZE,
  MATRIX_BRUSH_LINK_DISPATCH_YIELD_MS,
} from "@/config/ui";
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
  networkLabel: string;
  symmetric: boolean;
  selectionVisible?: boolean;
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

type LinkSelectionInput = {
  rowId: string;
  rowLabel: string;
  colId: string;
  colLabel: string;
  value: number;
};

export const useMatrixHeatmapController = ({
  data,
  labels,
  rowLabels,
  colLabels,
  labelNames,
  compoundId,
  networkLabel,
  symmetric,
  selectionVisible = true,
}: UseMatrixHeatmapControllerArgs) => {
  const dispatch = useAppDispatch();
  const selectedLinksById = useAppSelector(
    (state) => state.visualizationUi.selectedLinksById,
  );
  const selectedLinkIdsByRowId = useAppSelector(
    (state) => state.visualizationUi.selectedLinkIdsByRowId,
  );
  const scheduledDispatchTimeoutIdsRef = useRef<number[]>([]);

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
    if (!selectionVisible) return [];
    if (!resolvedRowLabels || !resolvedColLabels) return [];
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
    resolvedRowLabels.forEach((rowId, row) => {
      selectedLinkIdsByRowId[rowId]?.forEach((linkId) => {
        const link = selectedLinksById[linkId];
        if (!link) return;
        const col = colIndexById.get(link.colId);
        addCell(row, col);
      });
    });
    return next;
  }, [
    selectedLinkIdsByRowId,
    selectedLinksById,
    resolvedRowLabels,
    resolvedColLabels,
    selectionVisible,
  ]);

  const scheduleDispatchChunk = useCallback((callback: () => void) => {
    const timeoutId = window.setTimeout(() => {
      scheduledDispatchTimeoutIdsRef.current =
        scheduledDispatchTimeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, MATRIX_BRUSH_LINK_DISPATCH_YIELD_MS);
    scheduledDispatchTimeoutIdsRef.current.push(timeoutId);
  }, []);

  useEffect(
    () => () => {
      scheduledDispatchTimeoutIdsRef.current.forEach((id) =>
        window.clearTimeout(id),
      );
      scheduledDispatchTimeoutIdsRef.current = [];
    },
    [],
  );

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

  const createSelectedLink = useCallback(
    ({
      rowId,
      rowLabel,
      colId,
      colLabel,
      value,
    }: LinkSelectionInput): SelectedLink => {
      const draft = createSelectedLinkDraft({
        row: {
          id: rowId,
          label: rowLabel,
          index: labelIndexById.get(rowId),
        },
        col: {
          id: colId,
          label: colLabel,
          index: labelIndexById.get(colId),
        },
        symmetric,
      });

      return {
        ...draft,
        sources: [
          {
            compoundId,
            networkLabel,
            value,
          },
        ],
      };
    },
    [compoundId, labelIndexById, networkLabel, symmetric],
  );

  const handleSelect = useCallback(
    (payload: CellPayload) => {
      const rowLabel = labelNames?.[payload.rowId] ?? payload.rowLabel;
      const colLabel = labelNames?.[payload.colId] ?? payload.colLabel;
      const removalIds = getSelectedLinkRemovalIds(
        payload.rowId,
        payload.colId,
        symmetric,
      );
      const existingId = removalIds.find((id) => selectedLinksById[id]);
      if (existingId) {
        dispatch(removeSelectedLink(existingId));
        return;
      }
      dispatch(
        addSelectedLink(
          createSelectedLink({
            rowId: payload.rowId,
            rowLabel,
            colId: payload.colId,
            colLabel,
            value: payload.value,
          }),
        ),
      );
    },
    [
      createSelectedLink,
      dispatch,
      labelNames,
      selectedLinksById,
      symmetric,
    ],
  );

  const handleBrushSelectLinks = useCallback(
    (payload: MatrixBrushPayload) => {
      let cursor = 0;
      const selectedIds = new Set<string>();

      const processChunk = () => {
        const links: SelectedLink[] = [];
        const end = Math.min(
          cursor + MATRIX_BRUSH_LINK_DISPATCH_CHUNK_SIZE,
          payload.cells.length,
        );

        for (; cursor < end; cursor += 1) {
          const cell = payload.cells[cursor];
          if (!cell) continue;
          const rowId = cell.rowLabel;
          const rowLabel = labelNames?.[rowId] ?? rowId;
          const colId = cell.colLabel;
          const link = createSelectedLink({
            rowId,
            rowLabel,
            colId,
            colLabel: labelNames?.[colId] ?? colId,
            value: cell.value,
          });
          const removalIds = getSelectedLinkRemovalIds(rowId, colId, symmetric);
          if (
            removalIds.some(
              (id) => Boolean(selectedLinksById[id]) || selectedIds.has(id),
            )
          ) {
            continue;
          }

          selectedIds.add(link.id);
          links.push(link);
        }

        if (links.length > 0) dispatch(addSelectedLinks(links));
        if (cursor < payload.cells.length) scheduleDispatchChunk(processChunk);
      };

      processChunk();
    },
    [
      createSelectedLink,
      dispatch,
      labelNames,
      scheduleDispatchChunk,
      selectedLinksById,
      symmetric,
    ],
  );

  const handleBrushDeselectLinks = useCallback(
    (payload: MatrixBrushPayload) => {
      let cursor = 0;

      const processChunk = () => {
        const ids = new Set<string>();
        const end = Math.min(
          cursor + MATRIX_BRUSH_LINK_DISPATCH_CHUNK_SIZE,
          payload.cells.length,
        );

        for (; cursor < end; cursor += 1) {
          const cell = payload.cells[cursor];
          if (!cell) continue;
          getSelectedLinkRemovalIds(
            cell.rowLabel,
            cell.colLabel,
            symmetric,
          ).forEach((id) => ids.add(id));
        }

        if (ids.size > 0) dispatch(removeSelectedLinks([...ids]));
        if (cursor < payload.cells.length) scheduleDispatchChunk(processChunk);
      };

      processChunk();
    },
    [dispatch, scheduleDispatchChunk, symmetric],
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
