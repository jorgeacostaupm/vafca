import type { MatrixViewData } from "@/types/connectivityBundle";
import type { MatrixStats } from "@/types/datasetState";

export const buildMatrixStats = (
  matrices: MatrixViewData[],
): MatrixStats => {
  const stats: MatrixStats = {
    total: matrices.length,
    byStat: {},
    byMeasure: {},
    byMeasureStatPopulation: {},
    byMeasureStatPopulationSet: {},
  };

  for (const matrix of matrices) {
    stats.byStat[matrix.statId] = (stats.byStat[matrix.statId] ?? 0) + 1;
    stats.byMeasure[matrix.measureId] =
      (stats.byMeasure[matrix.measureId] ?? 0) + 1;

    const measureEntry = stats.byMeasureStatPopulation[matrix.measureId] ?? {};
    const statEntry = measureEntry[matrix.statId] ?? {};

    for (const populationId of matrix.populationIds) {
      statEntry[populationId] = (statEntry[populationId] ?? 0) + 1;
    }

    measureEntry[matrix.statId] = statEntry;
    stats.byMeasureStatPopulation[matrix.measureId] = measureEntry;

    const populationKey = [...matrix.populationIds].sort().join("+");
    const measureSetEntry =
      stats.byMeasureStatPopulationSet[matrix.measureId] ?? {};
    const statSetEntry = measureSetEntry[matrix.statId] ?? {};
    statSetEntry[populationKey] = (statSetEntry[populationKey] ?? 0) + 1;
    measureSetEntry[matrix.statId] = statSetEntry;
    stats.byMeasureStatPopulationSet[matrix.measureId] = measureSetEntry;
  }

  return stats;
};
