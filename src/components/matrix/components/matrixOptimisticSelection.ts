export type MatrixSelectedCell = {
  row: number;
  col: number;
};

export const getMatrixSelectedCellKey = (cell: MatrixSelectedCell) =>
  `${cell.row}:${cell.col}`;

const getMirroredMatrixSelectedCellKey = (key: string) => {
  const [row, col] = key.split(":");
  return row !== undefined && col !== undefined ? `${col}:${row}` : key;
};

const hasMatrixSelectedCellKey = (
  keys: Set<string>,
  key: string,
  symmetric: boolean,
) => keys.has(key) || (symmetric && keys.has(getMirroredMatrixSelectedCellKey(key)));

const addMatrixSelectedCell = (
  cells: MatrixSelectedCell[],
  seen: Set<string>,
  cell: MatrixSelectedCell,
) => {
  const key = getMatrixSelectedCellKey(cell);
  if (seen.has(key)) return;
  seen.add(key);
  cells.push(cell);
};

export const getMatrixSelectedCellKeySet = (cells?: MatrixSelectedCell[]) =>
  new Set((cells ?? []).map(getMatrixSelectedCellKey));

export const mergeOptimisticMatrixSelection = ({
  selectedCells,
  optimisticSelectedCells,
  optimisticDeselectedKeys,
}: {
  selectedCells?: MatrixSelectedCell[];
  optimisticSelectedCells: Map<string, MatrixSelectedCell>;
  optimisticDeselectedKeys: Set<string>;
}) => {
  const merged: MatrixSelectedCell[] = [];
  const seen = new Set<string>();

  selectedCells?.forEach((cell) => {
    const key = getMatrixSelectedCellKey(cell);
    if (optimisticDeselectedKeys.has(key)) return;
    addMatrixSelectedCell(merged, seen, cell);
  });

  optimisticSelectedCells.forEach((cell, key) => {
    if (optimisticDeselectedKeys.has(key)) return;
    addMatrixSelectedCell(merged, seen, cell);
  });

  return merged;
};

export const reconcileOptimisticMatrixSelection = ({
  reduxSelectedKeys,
  optimisticSelectedCells,
  optimisticDeselectedKeys,
  symmetric,
}: {
  reduxSelectedKeys: Set<string>;
  optimisticSelectedCells: Map<string, MatrixSelectedCell>;
  optimisticDeselectedKeys: Set<string>;
  symmetric: boolean;
}) => {
  optimisticSelectedCells.forEach((_cell, key) => {
    if (hasMatrixSelectedCellKey(reduxSelectedKeys, key, symmetric)) {
      optimisticSelectedCells.delete(key);
    }
  });

  optimisticDeselectedKeys.forEach((key) => {
    if (!hasMatrixSelectedCellKey(reduxSelectedKeys, key, symmetric)) {
      optimisticDeselectedKeys.delete(key);
    }
  });
};

const assertMatrixOptimisticSelection = () => {
  const optimisticSelectedCells = new Map<string, MatrixSelectedCell>();
  const optimisticDeselectedKeys = new Set<string>();
  optimisticSelectedCells.set("1:1", { row: 1, col: 1 });
  optimisticDeselectedKeys.add("0:0");

  const merged = mergeOptimisticMatrixSelection({
    selectedCells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
    optimisticSelectedCells,
    optimisticDeselectedKeys,
  });

  console.assert(merged.length === 2, "optimistic selection merges add/remove layers");
  console.assert(
    merged.some((cell) => cell.row === 1 && cell.col === 1),
    "optimistic selected cells are visible before Redux confirms",
  );

  reconcileOptimisticMatrixSelection({
    reduxSelectedKeys: new Set(["1:1"]),
    optimisticSelectedCells,
    optimisticDeselectedKeys,
    symmetric: false,
  });

  console.assert(
    optimisticSelectedCells.size === 0 && optimisticDeselectedKeys.size === 0,
    "confirmed optimistic state is pruned",
  );

  const symmetricSelectedCells = new Map<string, MatrixSelectedCell>();
  symmetricSelectedCells.set("2:1", { row: 2, col: 1 });
  reconcileOptimisticMatrixSelection({
    reduxSelectedKeys: new Set(["1:2"]),
    optimisticSelectedCells: symmetricSelectedCells,
    optimisticDeselectedKeys: new Set(),
    symmetric: true,
  });
  console.assert(
    symmetricSelectedCells.size === 0,
    "symmetric optimistic cells reconcile with mirrored Redux cells",
  );
};

if (import.meta.env.DEV) {
  assertMatrixOptimisticSelection();
}
