import type { ConnectivityMatrix, StatCatalogEntry } from "@/types/connectivityBundle";

export type StatCatalogGroup = "matrix" | "comparison";

export type StatUsageById = Record<
  string,
  {
    comparison: boolean;
    matrix: boolean;
  }
>;

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
  matrices: ConnectivityMatrix[],
): StatCatalogGroup => {
  const usage = buildStatUsageById(matrices)[stat.id];
  return classifyStatCatalogItemWithUsage(stat, usage);
};

export const buildStatUsageById = (matrices: ConnectivityMatrix[]): StatUsageById =>
  matrices.reduce<StatUsageById>((usageById, matrix) => {
    const statId = matrix.stat.id;
    const current = usageById[statId] ?? { comparison: false, matrix: false };
    if (matrix.kind === "comparison") {
      current.comparison = true;
    } else {
      current.matrix = true;
    }
    usageById[statId] = current;
    return usageById;
  }, {});

export const classifyStatCatalogItemWithUsage = (
  stat: Pick<StatCatalogEntry, "id" | "category">,
  usage?: StatUsageById[string],
): StatCatalogGroup => {
  if (usage?.comparison) return "comparison";
  if (usage?.matrix) return "matrix";

  if (stat.category && COMPARISON_STAT_CATEGORIES.has(stat.category)) {
    return "comparison";
  }

  if (stat.category && MATRIX_STAT_CATEGORIES.has(stat.category)) {
    return "matrix";
  }

  return "matrix";
};
