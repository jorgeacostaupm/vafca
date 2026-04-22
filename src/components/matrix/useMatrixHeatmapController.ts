import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addSelectedLink,
  clearHoveredCell,
  clearHoveredNode,
  removeSelectedLink,
  setHoveredCell,
  type SelectedLink,
} from "@/store/slices/visualizationUiSlice";

type UseMatrixHeatmapControllerArgs = {
  data: number[][];
  labels?: string[];
  rowLabels?: string[];
  colLabels?: string[];
  labelNames?: Record<string, string>;
  compoundId: string;
  matrixLabel: string;
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
}: UseMatrixHeatmapControllerArgs) => {
  const dispatch = useAppDispatch();
  const hoveredCell = useAppSelector((state) => state.visualizationUi.hoveredCell);
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

  const selectedCells = useMemo(() => {
    if (!resolvedRowLabels || !resolvedColLabels) return [];
    const rowIndexById = new Map(resolvedRowLabels.map((id, index) => [id, index]));
    const colIndexById = new Map(resolvedColLabels.map((id, index) => [id, index]));
    const next: Array<{ row: number; col: number }> = [];
    const seen = new Set<string>();
    const addCell = (row?: number, col?: number) => {
      if (row === undefined || col === undefined) return;
      const key = `${row}:${col}`;
      if (seen.has(key)) return;
      seen.add(key);
      next.push({ row, col });
    };
    selectedLinks.forEach((link: SelectedLink) => {
      addCell(rowIndexById.get(link.rowId), colIndexById.get(link.colId));
    });
    return next;
  }, [selectedLinks, resolvedRowLabels, resolvedColLabels]);

  const handleHover = (payload: CellPayload) => {
    dispatch(setHoveredCell({ rowId: payload.rowId, colId: payload.colId }));
    dispatch(clearHoveredNode());
  };

  const handleLeave = () => {
    dispatch(clearHoveredCell());
  };

  const handleSelect = (payload: CellPayload) => {
    const id = `${payload.rowId}::${payload.colId}`;
    const rowLabel = labelNames?.[payload.rowId] ?? payload.rowLabel;
    const colLabel = labelNames?.[payload.colId] ?? payload.colLabel;
    const alreadySelected = selectedLinks.some((link) => link.id === id);
    if (alreadySelected) {
      dispatch(removeSelectedLink(id));
      return;
    }
    dispatch(
      addSelectedLink({
        id,
        rowId: payload.rowId,
        colId: payload.colId,
        rowLabel,
        colLabel,
        sources: [
          {
            compoundId,
            matrixLabel,
            value: payload.value,
          },
        ],
      }),
    );
  };

  return {
    hoveredCell,
    selectedCells,
    handleHover,
    handleLeave,
    handleSelect,
  };
};
