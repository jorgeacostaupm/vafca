type MatrixCellPoint = {
  row: number;
  col: number;
};

type RowInterval = {
  row: number;
  col: number;
  colSpan: number;
};

type CellSelection = {
  keys: Set<string>;
  colsByRow: Map<number, number[]>;
};

export type MatrixSelectionRect = {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  key: string;
};

const getCellKey = (row: number, col: number) => `${row}:${col}`;

const getIntervalKey = (interval: Pick<RowInterval, "col" | "colSpan">) =>
  `${interval.col}:${interval.colSpan}`;

const getRectKey = (rect: Pick<MatrixSelectionRect, "row" | "col" | "colSpan">) =>
  `${rect.row}:${rect.col}:${rect.colSpan}`;

const createSelectionRect = (
  row: number,
  col: number,
  rowSpan: number,
  colSpan: number,
): MatrixSelectionRect => ({
  row,
  col,
  rowSpan,
  colSpan,
  key: getRectKey({ row, col, colSpan }),
});

const getMirroredRect = (rect: MatrixSelectionRect) =>
  createSelectionRect(rect.col, rect.row, rect.colSpan, rect.rowSpan);

const isVisibleCell = (
  visibleData: number[][] | undefined,
  row: number,
  col: number,
) => !visibleData || Number.isFinite(visibleData[row]?.[col]);

const buildRowIntervals = (colsByRow: Map<number, number[]>): RowInterval[] => {
  const intervals: RowInterval[] = [];

  [...colsByRow.entries()]
    .sort(([left], [right]) => left - right)
    .forEach(([row, cols]) => {
      cols.sort((left, right) => left - right);

      let start = cols[0];
      let previous = cols[0];
      if (start === undefined || previous === undefined) return;

      for (let index = 1; index < cols.length; index += 1) {
        const col = cols[index];
        if (col === undefined || col === previous) continue;

        if (col === previous + 1) {
          previous = col;
          continue;
        }

        intervals.push({ row, col: start, colSpan: previous - start + 1 });
        start = col;
        previous = col;
      }

      intervals.push({ row, col: start, colSpan: previous - start + 1 });
    });

  return intervals;
};

const groupIntervalsIntoRects = (intervals: RowInterval[]): MatrixSelectionRect[] => {
  const rects: MatrixSelectionRect[] = [];
  let active = new Map<string, MatrixSelectionRect>();
  let activeRow: number | null = null;

  // ponytail: greedy exact-span merge; if we need minimum tiling for staggered
  // selections, replace this with a rectangle cover pass.
  intervals.forEach((interval) => {
    if (activeRow !== interval.row) {
      if (activeRow !== null && interval.row !== activeRow + 1) {
        rects.push(...active.values());
        active = new Map();
      }
      activeRow = interval.row;
    }

    const intervalKey = getIntervalKey(interval);
    const existing = active.get(intervalKey);

    if (existing && existing.row + existing.rowSpan === interval.row) {
      existing.rowSpan += 1;
      return;
    }

    if (existing) rects.push(existing);

    active.set(
      intervalKey,
      createSelectionRect(interval.row, interval.col, 1, interval.colSpan),
    );
  });

  rects.push(...active.values());
  return rects;
};

const addColToRow = (colsByRow: Map<number, number[]>, row: number, col: number) => {
  const rowCols = colsByRow.get(row);
  if (rowCols) {
    rowCols.push(col);
    return;
  }
  colsByRow.set(row, [col]);
};

const createCellSelection = (): CellSelection => ({
  keys: new Set(),
  colsByRow: new Map(),
});

const addCellToSelection = (
  selection: CellSelection,
  row: number,
  col: number,
) => {
  const key = getCellKey(row, col);
  if (selection.keys.has(key)) return;
  selection.keys.add(key);
  addColToRow(selection.colsByRow, row, col);
};

const hasCell = (selection: CellSelection, row: number, col: number) =>
  selection.keys.has(getCellKey(row, col));

const buildRectsFromRows = (
  sourceRows: Map<number, number[]>,
  shouldUseCell: (row: number, col: number) => boolean = () => true,
) => {
  const colsByRow = new Map<number, number[]>();

  sourceRows.forEach((cols, row) => {
    cols.forEach((col) => {
      if (shouldUseCell(row, col)) addColToRow(colsByRow, row, col);
    });
  });

  return groupIntervalsIntoRects(buildRowIntervals(colsByRow));
};

const buildDiagonalSquares = (selection: CellSelection, size: number) => {
  const squares: MatrixSelectionRect[] = [];
  const coveredKeys = new Set<string>();
  let index = 0;

  while (index < size) {
    if (!hasCell(selection, index, index)) {
      index += 1;
      continue;
    }

    let end = index;
    for (let next = index + 1; next < size; next += 1) {
      if (!hasCell(selection, next, next)) break;

      let canExpand = true;
      for (let cursor = index; cursor <= next; cursor += 1) {
        if (
          !hasCell(selection, cursor, next) ||
          !hasCell(selection, next, cursor)
        ) {
          canExpand = false;
          break;
        }
      }

      if (!canExpand) break;
      end = next;
    }

    const span = end - index + 1;
    squares.push(createSelectionRect(index, index, span, span));

    for (let row = index; row <= end; row += 1) {
      for (let col = index; col <= end; col += 1) {
        coveredKeys.add(getCellKey(row, col));
      }
    }

    index = end + 1;
  }

  return { squares, coveredKeys };
};

const sortRectsForStablePaint = (rects: MatrixSelectionRect[]) =>
  rects.sort((left, right) => {
    if (left.row !== right.row) return left.row - right.row;
    if (left.col !== right.col) return left.col - right.col;
    if (left.rowSpan !== right.rowSpan) return left.rowSpan - right.rowSpan;
    return left.colSpan - right.colSpan;
  });

const buildSymmetricSelectionRects = (selection: CellSelection, size: number) => {
  const { squares, coveredKeys } = buildDiagonalSquares(selection, size);
  const upperRects = buildRectsFromRows(
    selection.colsByRow,
    (row, col) => row < col && !coveredKeys.has(getCellKey(row, col)),
  );
  const rects = [...squares];

  upperRects.forEach((rect) => {
    rects.push(rect, getMirroredRect(rect));
  });

  return sortRectsForStablePaint(rects);
};

export const buildSelectionRectBlocks = ({
  selectedCells,
  visibleData,
  rows,
  cols,
  symmetric,
}: {
  selectedCells?: MatrixCellPoint[];
  visibleData?: number[][];
  rows: number;
  cols: number;
  symmetric: boolean;
}): MatrixSelectionRect[] => {
  const canMirror = symmetric && rows === cols;
  const selection = createCellSelection();

  const addCell = (row: number, col: number) => {
    if (
      !Number.isInteger(row) ||
      !Number.isInteger(col) ||
      row < 0 ||
      col < 0 ||
      row >= rows ||
      col >= cols ||
      !isVisibleCell(visibleData, row, col)
    ) {
      return;
    }

    addCellToSelection(selection, row, col);
  };

  selectedCells?.forEach((cell) => {
    addCell(cell.row, cell.col);
    if (canMirror) addCell(cell.col, cell.row);
  });

  if (canMirror) return buildSymmetricSelectionRects(selection, rows);
  return buildRectsFromRows(selection.colsByRow);
};

const assertMatrixSelectionRects = () => {
  const hasRect = (
    rects: MatrixSelectionRect[],
    expected: Omit<MatrixSelectionRect, "key">,
  ) =>
    rects.some(
      (rect) =>
        rect.row === expected.row &&
        rect.col === expected.col &&
        rect.rowSpan === expected.rowSpan &&
        rect.colSpan === expected.colSpan,
    );

  const dense = buildSelectionRectBlocks({
    selectedCells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 3, col: 2 },
    ],
    rows: 4,
    cols: 4,
    symmetric: false,
  });

  console.assert(dense.length === 2, "selected cells compact into rectangles");
  console.assert(
    hasRect(dense, { row: 0, col: 0, rowSpan: 2, colSpan: 2 }),
    "dense selected cells become one rectangular block",
  );

  const mirrored = buildSelectionRectBlocks({
    selectedCells: [{ row: 0, col: 1 }],
    rows: 2,
    cols: 2,
    symmetric: true,
  });

  console.assert(mirrored.length === 2, "symmetric selections include mirror cells");

  const diagonal = buildSelectionRectBlocks({
    selectedCells: [
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
    ],
    rows: 6,
    cols: 6,
    symmetric: true,
  });

  console.assert(
    hasRect(diagonal, { row: 2, col: 2, rowSpan: 2, colSpan: 2 }),
    "symmetric diagonal selections keep the maximum diagonal square",
  );
  console.assert(
    hasRect(diagonal, { row: 1, col: 2, rowSpan: 1, colSpan: 3 }) &&
      hasRect(diagonal, { row: 2, col: 1, rowSpan: 3, colSpan: 1 }),
    "off-diagonal rectangles are painted with mirrored partners",
  );
};

if (import.meta.env.DEV) {
  assertMatrixSelectionRects();
}
