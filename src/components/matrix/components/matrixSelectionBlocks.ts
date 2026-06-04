export type MatrixCellPoint = {
  row: number;
  col: number;
};

export type MatrixSelectionBlock = {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
};

type RowInterval = {
  row: number;
  col: number;
  colSpan: number;
};

const blockKey = (block: Pick<MatrixSelectionBlock, "col" | "colSpan">) =>
  `${block.col}:${block.colSpan}`;

const pointKey = (row: number, col: number) => `${row}:${col}`;

const isVisibleCell = (visibleData: number[][] | undefined, row: number, col: number) => {
  if (!visibleData) return true;
  return Number.isFinite(visibleData[row]?.[col]);
};

const addVisiblePoint = (
  points: Map<string, MatrixCellPoint>,
  visibleData: number[][] | undefined,
  row: number,
  col: number,
) => {
  if (!isVisibleCell(visibleData, row, col)) return;
  points.set(pointKey(row, col), { row, col });
};

const buildRowIntervals = (cells: MatrixCellPoint[]): RowInterval[] => {
  const colsByRow = new Map<number, number[]>();

  cells.forEach((cell) => {
    const cols = colsByRow.get(cell.row);
    if (cols) {
      cols.push(cell.col);
      return;
    }
    colsByRow.set(cell.row, [cell.col]);
  });

  const intervals: RowInterval[] = [];
  [...colsByRow.entries()]
    .sort(([rowA], [rowB]) => rowA - rowB)
    .forEach(([row, cols]) => {
      cols.sort((a, b) => a - b);

      let start: number | null = null;
      let previous: number | null = null;

      cols.forEach((col) => {
        if (col === previous) return;

        if (start === null || previous === null) {
          start = col;
          previous = col;
          return;
        }

        if (col === previous + 1) {
          previous = col;
          return;
        }

        intervals.push({ row, col: start, colSpan: previous - start + 1 });
        start = col;
        previous = col;
      });

      if (start !== null && previous !== null) {
        intervals.push({ row, col: start, colSpan: previous - start + 1 });
      }
    });

  return intervals;
};

export const groupSelectedCellsIntoBlocks = (
  cells: MatrixCellPoint[],
): MatrixSelectionBlock[] => {
  if (cells.length === 0) return [];

  const intervals = buildRowIntervals(cells);
  const blocks: MatrixSelectionBlock[] = [];
  let active = new Map<string, MatrixSelectionBlock>();
  let activeRow: number | null = null;

  intervals.forEach((interval) => {
    if (activeRow !== interval.row) {
      if (activeRow !== null && interval.row !== activeRow + 1) {
        blocks.push(...active.values());
        active = new Map();
      }
      activeRow = interval.row;
    }

    const key = blockKey(interval);
    const existing = active.get(key);

    if (existing && existing.row + existing.rowSpan === interval.row) {
      existing.rowSpan += 1;
      return;
    }

    if (existing) blocks.push(existing);

    active.set(key, {
      row: interval.row,
      col: interval.col,
      rowSpan: 1,
      colSpan: interval.colSpan,
    });
  });

  blocks.push(...active.values());
  return blocks;
};

const blockIntersectsDiagonal = (block: MatrixSelectionBlock) => {
  const rowEnd = block.row + block.rowSpan - 1;
  const colEnd = block.col + block.colSpan - 1;
  return block.row <= colEnd && block.col <= rowEnd;
};

type DiagonalInterval = {
  start: number;
  end: number;
};

const getDiagonalInterval = (
  block: MatrixSelectionBlock,
): DiagonalInterval | null => {
  const rowEnd = block.row + block.rowSpan - 1;
  const colEnd = block.col + block.colSpan - 1;
  const start = Math.max(block.row, block.col);
  const end = Math.min(rowEnd, colEnd);
  return start <= end ? { start, end } : null;
};

const mergeDiagonalIntervals = (
  intervals: DiagonalInterval[],
): DiagonalInterval[] => {
  if (intervals.length === 0) return [];

  const sorted = intervals
    .slice()
    .sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: DiagonalInterval[] = [];

  sorted.forEach((interval) => {
    const previous = merged[merged.length - 1];
    if (!previous || interval.start > previous.end + 1) {
      merged.push({ ...interval });
      return;
    }

    previous.end = Math.max(previous.end, interval.end);
  });

  return merged;
};

const isInsideDiagonalSquare = (
  cell: MatrixCellPoint,
  intervals: DiagonalInterval[],
) =>
  intervals.some(
    (interval) =>
      cell.row >= interval.start &&
      cell.row <= interval.end &&
      cell.col >= interval.start &&
      cell.col <= interval.end,
  );

const buildVisibleDiagonalSquareBlocks = (
  intervals: DiagonalInterval[],
  visibleData: number[][] | undefined,
): MatrixSelectionBlock[] => {
  const points = new Map<string, MatrixCellPoint>();

  intervals.forEach((interval) => {
    for (let row = interval.start; row <= interval.end; row += 1) {
      for (let col = interval.start; col <= interval.end; col += 1) {
        addVisiblePoint(points, visibleData, row, col);
      }
    }
  });

  return groupSelectedCellsIntoBlocks([...points.values()]);
};

const getVisibleColumnCount = (visibleData: number[][] | undefined) =>
  visibleData?.[0]?.length ?? 0;

const canMirrorSelection = (
  visibleData: number[][] | undefined,
  symmetric: boolean,
) => {
  if (!symmetric || !visibleData?.length) return false;
  return visibleData.length === getVisibleColumnCount(visibleData);
};

const addMirroredVisiblePoints = (args: {
  points: Map<string, MatrixCellPoint>;
  cells: MatrixCellPoint[];
  visibleData?: number[][];
}) => {
  const { points, cells, visibleData } = args;

  cells.forEach((cell) => {
    addVisiblePoint(points, visibleData, cell.col, cell.row);
  });
};

const uniqueBlocks = (blocks: MatrixSelectionBlock[]) => {
  const seen = new Set<string>();
  return blocks.filter((block) => {
    const key = `${block.row}:${block.col}:${block.rowSpan}:${block.colSpan}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const buildSelectionOverlayBlocks = (args: {
  cells: MatrixCellPoint[];
  visibleData?: number[][];
  symmetric: boolean;
}): MatrixSelectionBlock[] => {
  const { cells, visibleData, symmetric } = args;
  const visibleCells = cells.filter((cell) =>
    isVisibleCell(visibleData, cell.row, cell.col),
  );
  if (visibleCells.length === 0) return [];

  const baseBlocks = groupSelectedCellsIntoBlocks(visibleCells);
  const diagonalIntervals = mergeDiagonalIntervals(
    baseBlocks
      .filter(blockIntersectsDiagonal)
      .map(getDiagonalInterval)
      .filter((interval): interval is DiagonalInterval => interval !== null),
  );

  const diagonalBlocks = buildVisibleDiagonalSquareBlocks(
    diagonalIntervals,
    visibleData,
  );
  const nonDiagonalCells = visibleCells.filter(
    (cell) => !isInsideDiagonalSquare(cell, diagonalIntervals),
  );
  const nonDiagonalPoints = new Map<string, MatrixCellPoint>();

  nonDiagonalCells.forEach((cell) => {
    addVisiblePoint(nonDiagonalPoints, visibleData, cell.row, cell.col);
  });

  if (canMirrorSelection(visibleData, symmetric)) {
    addMirroredVisiblePoints({
      points: nonDiagonalPoints,
      cells: nonDiagonalCells,
      visibleData,
    });
  }

  return uniqueBlocks([
    ...diagonalBlocks,
    ...groupSelectedCellsIntoBlocks([...nonDiagonalPoints.values()]),
  ]);
};
