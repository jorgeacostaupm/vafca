import type { NetworkStats } from "@/types/datasetState";
import type { StoredNetworkView } from "@/types/networkViewStore";

export const buildNetworkStats = (
  networks: StoredNetworkView[],
): NetworkStats => {
  const stats: NetworkStats = {
    total: networks.length,
    byStat: {},
    byMeasure: {},
    byMeasureStatPopulation: {},
    byMeasureStatPopulationSet: {},
  };

  for (const network of networks) {
    stats.byStat[network.statId] = (stats.byStat[network.statId] ?? 0) + 1;
    stats.byMeasure[network.measureId] =
      (stats.byMeasure[network.measureId] ?? 0) + 1;

    const measureEntry = stats.byMeasureStatPopulation[network.measureId] ?? {};
    const statEntry = measureEntry[network.statId] ?? {};

    for (const populationId of network.populationIds) {
      statEntry[populationId] = (statEntry[populationId] ?? 0) + 1;
    }

    measureEntry[network.statId] = statEntry;
    stats.byMeasureStatPopulation[network.measureId] = measureEntry;

    const populationKey = [...network.populationIds].sort().join("+");
    const measureSetEntry =
      stats.byMeasureStatPopulationSet[network.measureId] ?? {};
    const statSetEntry = measureSetEntry[network.statId] ?? {};
    statSetEntry[populationKey] = (statSetEntry[populationKey] ?? 0) + 1;
    measureSetEntry[network.statId] = statSetEntry;
    stats.byMeasureStatPopulationSet[network.measureId] = measureSetEntry;
  }

  return stats;
};
