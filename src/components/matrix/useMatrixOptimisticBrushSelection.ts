import { useCallback, useEffect, useRef } from "react";

import {
  getMatrixSelectedCellKey,
  getMatrixSelectedCellKeySet,
  mergeOptimisticMatrixSelection,
  reconcileOptimisticMatrixSelection,
  type MatrixSelectedCell,
} from "@/components/matrix/components/matrixOptimisticSelection";
import type { MatrixBrushPayload } from "@/types/matrixHeatmap";

type UseMatrixOptimisticBrushSelectionArgs = {
  selectedCells?: MatrixSelectedCell[];
  selectionVisible: boolean;
  symmetric: boolean;
  onBrushSelectLinks?: (payload: MatrixBrushPayload) => void;
  onBrushDeselectLinks?: (payload: MatrixBrushPayload) => void;
  paintSelectedCells: (cells: MatrixSelectedCell[]) => void;
};

const addOptimisticSelectedCells = (
  payload: MatrixBrushPayload,
  optimisticSelectedCells: Map<string, MatrixSelectedCell>,
  optimisticDeselectedKeys: Set<string>,
) => {
  payload.cells.forEach((cell) => {
    const selectedCell = { row: cell.row, col: cell.col };
    const key = getMatrixSelectedCellKey(selectedCell);
    optimisticDeselectedKeys.delete(key);
    optimisticSelectedCells.set(key, selectedCell);
  });
};

const addOptimisticDeselectedCells = (
  payload: MatrixBrushPayload,
  optimisticSelectedCells: Map<string, MatrixSelectedCell>,
  optimisticDeselectedKeys: Set<string>,
  symmetric: boolean,
) => {
  payload.cells.forEach((cell) => {
    const key = getMatrixSelectedCellKey({ row: cell.row, col: cell.col });
    optimisticSelectedCells.delete(key);
    optimisticDeselectedKeys.add(key);

    if (!symmetric) return;

    const mirroredKey = getMatrixSelectedCellKey({
      row: cell.col,
      col: cell.row,
    });
    optimisticSelectedCells.delete(mirroredKey);
    optimisticDeselectedKeys.add(mirroredKey);
  });
};

export const useMatrixOptimisticBrushSelection = ({
  selectedCells,
  selectionVisible,
  symmetric,
  onBrushSelectLinks,
  onBrushDeselectLinks,
  paintSelectedCells,
}: UseMatrixOptimisticBrushSelectionArgs) => {
  const selectedCellsRef = useRef(selectedCells);
  const optimisticSelectedCellsRef = useRef<Map<string, MatrixSelectedCell>>(
    new Map(),
  );
  const optimisticDeselectedKeysRef = useRef<Set<string>>(new Set());
  const scheduledFrameIdsRef = useRef<number[]>([]);
  const scheduledTimeoutIdsRef = useRef<number[]>([]);

  useEffect(() => {
    selectedCellsRef.current = selectedCells;
    if (!selectionVisible) {
      optimisticSelectedCellsRef.current.clear();
      optimisticDeselectedKeysRef.current.clear();
      return;
    }

    reconcileOptimisticMatrixSelection({
      reduxSelectedKeys: getMatrixSelectedCellKeySet(selectedCells),
      optimisticSelectedCells: optimisticSelectedCellsRef.current,
      optimisticDeselectedKeys: optimisticDeselectedKeysRef.current,
      symmetric,
    });
  }, [selectedCells, selectionVisible, symmetric]);

  const getDisplayedSelectedCells = useCallback(
    () =>
      selectionVisible
        ? mergeOptimisticMatrixSelection({
            selectedCells: selectedCellsRef.current,
            optimisticSelectedCells: optimisticSelectedCellsRef.current,
            optimisticDeselectedKeys: optimisticDeselectedKeysRef.current,
          })
        : [],
    [selectionVisible],
  );

  const scheduleAfterPaint = useCallback((callback: () => void) => {
    const frameId = window.requestAnimationFrame(() => {
      scheduledFrameIdsRef.current = scheduledFrameIdsRef.current.filter(
        (id) => id !== frameId,
      );
      const timeoutId = window.setTimeout(() => {
        scheduledTimeoutIdsRef.current = scheduledTimeoutIdsRef.current.filter(
          (id) => id !== timeoutId,
        );
        callback();
      }, 0);
      scheduledTimeoutIdsRef.current.push(timeoutId);
    });
    scheduledFrameIdsRef.current.push(frameId);
  }, []);

  const paintCurrentSelection = useCallback(
    () => paintSelectedCells(getDisplayedSelectedCells()),
    [getDisplayedSelectedCells, paintSelectedCells],
  );

  const handleBrushSelectLinks = useCallback(
    (payload: MatrixBrushPayload) => {
      if (selectionVisible) {
        addOptimisticSelectedCells(
          payload,
          optimisticSelectedCellsRef.current,
          optimisticDeselectedKeysRef.current,
        );
        paintCurrentSelection();
      }

      if (onBrushSelectLinks) {
        scheduleAfterPaint(() => onBrushSelectLinks(payload));
      }
    },
    [
      onBrushSelectLinks,
      paintCurrentSelection,
      scheduleAfterPaint,
      selectionVisible,
    ],
  );

  const handleBrushDeselectLinks = useCallback(
    (payload: MatrixBrushPayload) => {
      if (selectionVisible) {
        addOptimisticDeselectedCells(
          payload,
          optimisticSelectedCellsRef.current,
          optimisticDeselectedKeysRef.current,
          symmetric,
        );
        paintCurrentSelection();
      }

      if (onBrushDeselectLinks) {
        scheduleAfterPaint(() => onBrushDeselectLinks(payload));
      }
    },
    [
      onBrushDeselectLinks,
      paintCurrentSelection,
      scheduleAfterPaint,
      selectionVisible,
      symmetric,
    ],
  );

  useEffect(
    () => () => {
      scheduledFrameIdsRef.current.forEach((id) =>
        window.cancelAnimationFrame(id),
      );
      scheduledTimeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
      scheduledFrameIdsRef.current = [];
      scheduledTimeoutIdsRef.current = [];
    },
    [],
  );

  return {
    getDisplayedSelectedCells,
    handleBrushSelectLinks,
    handleBrushDeselectLinks,
  };
};
