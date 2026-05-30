import type { MatrixRecord, StatCatalogEntry } from "@/types/connectivityBundle";

export type StatCatalogGroup = "matrix" | "comparison";

const COMPARISON_STAT_CATEGORIES = new Set([
  "comparison",
  "effect_size",
  "inferential",
  "corrected_inferential",
  "standardized",
]);

const MATRIX_STAT_CATEGORIES = new Set([
  "subject",
  "descriptive",
  "dispersion",
  "derived",
]);

export const classifyStatCatalogItem = (
  stat: Pick<StatCatalogEntry, "id" | "category">,
  matrices: MatrixRecord[],
): StatCatalogGroup => {
  const usedBy = matrices.filter((matrix) => matrix.stat.id === stat.id);
  if (usedBy.some((matrix) => matrix.kind === "comparison")) return "comparison";
  if (usedBy.some((matrix) => matrix.kind !== "comparison")) return "matrix";

  if (stat.category && COMPARISON_STAT_CATEGORIES.has(stat.category)) {
    return "comparison";
  }

  if (stat.category && MATRIX_STAT_CATEGORIES.has(stat.category)) {
    return "matrix";
  }

  return "matrix";
};
