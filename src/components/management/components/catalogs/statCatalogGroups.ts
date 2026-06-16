import type { Network, Statistic } from "@/types/network";

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
  stat: Pick<Statistic, "id" | "category">,
  networks: Network[],
): StatCatalogGroup => {
  const usage = buildStatUsageById(networks)[stat.id];
  return classifyStatCatalogItemWithUsage(stat, usage);
};

export const buildStatUsageById = (networks: Network[]): StatUsageById =>
  networks.reduce<StatUsageById>((usageById, network) => {
    const statId = network.statisticId;
    const current = usageById[statId] ?? { comparison: false, matrix: false };
    if (network.source.type === "comparison") {
      current.comparison = true;
    } else {
      current.matrix = true;
    }
    usageById[statId] = current;
    return usageById;
  }, {});

export const classifyStatCatalogItemWithUsage = (
  stat: Pick<Statistic, "id" | "category">,
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
