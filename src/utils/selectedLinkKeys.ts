import type { SelectedLink } from "@/types/visualizationUi";

type LinkEndpoint = {
  id: string;
  label: string;
  index?: number;
};

export type SelectedLinkDraft = Pick<
  SelectedLink,
  "id" | "rowId" | "colId" | "rowLabel" | "colLabel" | "directed"
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
  symmetric,
}: {
  row: LinkEndpoint;
  col: LinkEndpoint;
  symmetric: boolean;
}): SelectedLinkDraft => {
  const directed = !symmetric;
  const [source, target] =
    symmetric && compareEndpoints(col, row) < 0 ? [col, row] : [row, col];

  return {
    id: buildLinkId(source.id, target.id),
    rowId: source.id,
    colId: target.id,
    rowLabel: source.label,
    colLabel: target.label,
    directed,
  };
};

export const getSelectedLinkRemovalIds = (
  rowId: string,
  colId: string,
  symmetric: boolean,
) => {
  const id = buildLinkId(rowId, colId);
  if (!symmetric || rowId === colId) return [id];
  return [id, buildLinkId(colId, rowId)];
};

