import type { AtlasDefinition, AtlasRoi, AtlasSource } from "@/types/atlas";
import type { MatrixOrderEntry, MatrixOrderItem } from "@/types/matrixOrder";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";

export const MATRIX_DERIVED_ATLAS_ID = "__matrix_derived_atlas__";

export const buildMatrixOrderItemsFromSize = (size: number): MatrixOrderItem[] =>
  Array.from({ length: Math.max(0, size) }, (_, index) => {
    const id = String(index);
    return {
      id,
      label: `ROI ${index + 1}`,
      name: `ROI ${index + 1}`,
    };
  });

const MATRIX_ORDER_LABEL_FIELDS = new Set(["id", "label", "name", "value", "acronym"]);

const isMatrixOrderObject = (
  item: MatrixOrderItem | MatrixOrderEntry,
): item is Record<string, unknown> =>
  typeof item === "object" && item !== null && !Array.isArray(item);

const getMatrixOrderExtraFields = (
  item: MatrixOrderItem | MatrixOrderEntry | undefined,
) => {
  if (!item || !isMatrixOrderObject(item)) return {};

  return Object.fromEntries(
    Object.entries(item).filter(([key]) => !MATRIX_ORDER_LABEL_FIELDS.has(key)),
  );
};

export const buildMatrixDerivedAtlas = (
  matrixOrder: MatrixOrderItem[] | MatrixOrderEntry[],
): AtlasDefinition | null => {
  const entries = normalizeMatrixOrder(matrixOrder);
  if (entries.length === 0) return null;

  return {
    id: MATRIX_DERIVED_ATLAS_ID,
    name: "Matrix-derived atlas",
    description: "Minimal atlas generated from the loaded matrix order.",
    rois: entries.map<AtlasRoi>((entry, index) => ({
      ...getMatrixOrderExtraFields(matrixOrder[index]),
      id: entry.id,
      label: entry.acronym ?? entry.label,
      name: entry.label,
    })),
  };
};

export const buildMatrixDerivedAtlasSource = (
  matrixOrder: MatrixOrderItem[] | MatrixOrderEntry[],
): AtlasSource | null => {
  const atlas = buildMatrixDerivedAtlas(matrixOrder);
  if (!atlas) return null;

  return {
    atlas,
    fileName: "Generated from matrices",
  };
};
