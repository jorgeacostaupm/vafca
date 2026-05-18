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

const getMatrixOrderTags = (
  item: MatrixOrderItem | MatrixOrderEntry | undefined,
) => {
  const extras = getMatrixOrderExtraFields(item);
  const flatTags = Object.fromEntries(
    Object.entries(extras).filter(
      (entry): entry is [string, string | number | boolean | null] => {
        const value = entry[1];
        return (
          value === null ||
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        );
      },
    ),
  );
  const itemRecord = item && isMatrixOrderObject(item)
    ? (item as Record<string, unknown>)
    : null;
  const tags = itemRecord?.tags;
  const nestedTags =
    typeof tags === "object" &&
    tags !== null &&
    !Array.isArray(tags)
      ? Object.fromEntries(
          Object.entries(tags).filter(
            (entry): entry is [string, string | number | boolean | null] => {
              const value = entry[1];
              return (
                value === null ||
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean"
              );
            },
          ),
        )
      : {};

  return { ...flatTags, ...nestedTags };
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
      index,
      id: entry.id,
      atlasId: entry.id,
      label: entry.acronym ?? entry.label,
      name: entry.label,
      tags: getMatrixOrderTags(matrixOrder[index]),
      coords: null,
      metadata: {},
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
