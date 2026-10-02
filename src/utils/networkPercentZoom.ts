import type {
  NetworkPercentFilterMode,
  ZoomSelection,
} from "@/types/networkVisualization";

export type PercentZoomMode = NetworkPercentFilterMode;

type PercentZoomLink = {
  rowId: string;
  colId: string;
  value: number;
};

type BuildPercentZoomSelectionArgs = {
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  symmetric: boolean;
  mode: PercentZoomMode;
  percent: number;
  includeAutoconnections: boolean;
};

const buildPercentZoomLinkKey = (a: string, b: string) =>
  a <= b ? `${a}::${b}` : `${b}::${a}`;

const hasSameLabelOrder = (rowLabels: string[], colLabels: string[]) => {
  if (rowLabels.length !== colLabels.length) return false;
  return rowLabels.every((label, index) => label === colLabels[index]);
};

const collectPercentZoomLinks = ({
  data,
  rowLabels,
  colLabels,
  symmetric,
  includeAutoconnections,
}: Pick<
  BuildPercentZoomSelectionArgs,
  "data" | "rowLabels" | "colLabels" | "symmetric" | "includeAutoconnections"
>) => {
  const links: PercentZoomLink[] = [];
  const skipSymmetricDuplicates =
    symmetric && hasSameLabelOrder(rowLabels, colLabels);

  data.forEach((rowValues, row) => {
    rowValues.forEach((value, col) => {
      const rowId = rowLabels[row];
      const colId = colLabels[col];
      if (!rowId || !colId || !Number.isFinite(value)) return;
      if (!includeAutoconnections && rowId === colId) return;
      if (skipSymmetricDuplicates && col < row) return;
      links.push({ rowId, colId, value });
    });
  });

  return links;
};

const getModeScore = (link: PercentZoomLink, mode: PercentZoomMode) => {
  if (mode === "top") return link.value;
  if (mode === "bottom") return -link.value;
  if (mode === "absoluteTop") return Math.abs(link.value);
  return -Math.abs(link.value);
};

const partitionByScore = (
  links: PercentZoomLink[],
  left: number,
  right: number,
  pivotIndex: number,
  mode: PercentZoomMode,
) => {
  const pivotScore = getModeScore(links[pivotIndex], mode);
  [links[pivotIndex], links[right]] = [links[right], links[pivotIndex]];
  let storeIndex = left;

  for (let index = left; index < right; index += 1) {
    if (getModeScore(links[index], mode) > pivotScore) {
      [links[storeIndex], links[index]] = [links[index], links[storeIndex]];
      storeIndex += 1;
    }
  }

  [links[right], links[storeIndex]] = [links[storeIndex], links[right]];
  return storeIndex;
};

const selectTopLinksByMode = (
  links: PercentZoomLink[],
  count: number,
  mode: PercentZoomMode,
) => {
  if (count >= links.length) return links;

  const selected = [...links];
  let left = 0;
  let right = selected.length - 1;
  const targetIndex = count - 1;

  while (left <= right) {
    const pivotIndex = Math.floor((left + right) / 2);
    const nextPivotIndex = partitionByScore(
      selected,
      left,
      right,
      pivotIndex,
      mode,
    );

    if (nextPivotIndex === targetIndex) break;
    if (nextPivotIndex > targetIndex) {
      right = nextPivotIndex - 1;
      continue;
    }
    left = nextPivotIndex + 1;
  }

  return selected.slice(0, count);
};

export const buildPercentZoomSelection = ({
  data,
  rowLabels,
  colLabels,
  symmetric,
  mode,
  percent,
  includeAutoconnections,
}: BuildPercentZoomSelectionArgs): ZoomSelection => {
  const links = collectPercentZoomLinks({
    data,
    rowLabels,
    colLabels,
    symmetric,
    includeAutoconnections,
  });

  if (links.length === 0) return null;

  const linkCount = Math.max(
    1,
    Math.ceil(links.length * (Math.min(Math.max(percent, 1), 100) / 100)),
  );
  const selected = selectTopLinksByMode(links, linkCount, mode);
  const endpoints = new Set<string>();
  const linkIds = new Set<string>();
  selected.forEach((link) => {
    endpoints.add(link.rowId);
    endpoints.add(link.colId);
    linkIds.add(buildPercentZoomLinkKey(link.rowId, link.colId));
  });

  const orderedLabels = [...rowLabels, ...colLabels].filter((label, index, labels) => {
    if (!endpoints.has(label)) return false;
    return labels.indexOf(label) === index;
  });

  if (orderedLabels.length === 0) return null;
  return {
    rows: orderedLabels,
    cols: orderedLabels,
    linkIds: [...linkIds].sort(),
  };
};

export const buildPercentLinkFilterIds = (
  args: BuildPercentZoomSelectionArgs,
) => new Set(buildPercentZoomSelection(args)?.linkIds ?? []);
