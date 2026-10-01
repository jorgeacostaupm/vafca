import type { SelectedLink } from "@/types/visualizationUi";

type LinkEndpoint = {
  id: string;
  label: string;
  index?: number;
};

export type SelectedLinkDraft = Pick<
  SelectedLink,
  "id" | "rowId" | "colId" | "rowLabel" | "colLabel"
>;

const buildLinkId = (rowId: string, colId: string) => `${rowId}::${colId}`;

const compareEndpoints = (left: LinkEndpoint, right: LinkEndpoint) => {
  if (
    typeof left.index === "number" &&
    typeof right.index === "number" &&
    left.index !== right.index
  ) {
    return left.index - right.index;
  }
  return left.id.localeCompare(right.id);
};

export const createSelectedLinkDraft = ({
  row,
  col,
}: {
  row: LinkEndpoint;
  col: LinkEndpoint;
}): SelectedLinkDraft => {
  const [source, target] =
    compareEndpoints(col, row) < 0 ? [col, row] : [row, col];

  return {
    id: buildLinkId(source.id, target.id),
    rowId: source.id,
    colId: target.id,
    rowLabel: source.label,
    colLabel: target.label,
  };
};

export const getSelectedLinkRemovalIds = (
  rowId: string,
  colId: string,
) => {
  const id = buildLinkId(rowId, colId);
  if (rowId === colId) return [id];
  return [id, buildLinkId(colId, rowId)];
};

export const findSelectedLinkId = (
  selected: Record<string, SelectedLink>,
  rowId: string,
  colId: string,
) => getSelectedLinkRemovalIds(rowId, colId).find((id) => selected[id]);
