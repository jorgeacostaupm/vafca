import { useCallback, useMemo } from "react";

import { setSharedHoverState } from "@/components/hover/sharedHover";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addSelectedLink,
  removeSelectedLinks,
} from "@/store/slices/visualizationUi";
import { selectActiveAnnotationLinksById,selectAnnotationLinkColors } from '@/store/slices/visualizationUi/annotationSelectors';
import { annotateMatrixBrush } from '@/store/slices/visualizationUi/thunks/annotateMatrixBrush';
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
  selectionVisible = true,
}: UseMatrixHeatmapControllerArgs) => {
  const dispatch = useAppDispatch();
  const selectedLinksById = useAppSelector(
    selectActiveAnnotationLinksById,
  );
  const linkColors = useAppSelector(selectAnnotationLinkColors);
  const annotationId = useAppSelector(state => state.visualizationUi.activeAnnotationId);

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
    const rowIndex = new Map(resolvedRowLabels.map((id, index) => [id, index]));
    for (const key of Object.keys(linkColors)) {
      const [rowId, colId] = key.split('::');
      addCell(rowIndex.get(rowId), colIndexById.get(colId));
    }
    return next;
  }, [
    linkColors,
    resolvedRowLabels,
    resolvedColLabels,
    selectionVisible,
  ]);

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
    [compoundId, labelIndexById, networkLabel],
  );

  const handleSelect = useCallback(
    (payload: CellPayload) => {
      const rowLabel = labelNames?.[payload.rowId] ?? payload.rowLabel;
      const colLabel = labelNames?.[payload.colId] ?? payload.colLabel;
      const removalIds = getSelectedLinkRemovalIds(
        payload.rowId,
        payload.colId,
      );
      const existingId = removalIds.find((id) => selectedLinksById[id]);
      if (existingId) {
        dispatch(removeSelectedLinks({ annotationId: annotationId!, ids: [existingId] }));
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
      annotationId,
      createSelectedLink,
      dispatch,
      labelNames,
      selectedLinksById,
    ],
  );

  const handleBrush = useCallback((payload: MatrixBrushPayload, mode: 'add' | 'remove') => {
    if (!annotationId) return;
    void dispatch(annotateMatrixBrush({
      annotationId, mode, cells: payload.cells,
      labelOrder: [...labelIndexById.keys()], labelNames, compoundId, networkLabel,
    }));
  }, [annotationId, compoundId, dispatch, labelIndexById, labelNames, networkLabel]);

  const handleBrushSelectLinks = useCallback((payload: MatrixBrushPayload) => handleBrush(payload, 'add'), [handleBrush]);
  const handleBrushDeselectLinks = useCallback((payload: MatrixBrushPayload) => handleBrush(payload, 'remove'), [handleBrush]);

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
