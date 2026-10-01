import type { DatasetNetworkSummary } from "@/types/datasetNetworkView";

export const buildNetworkStats = (
  networks: Array<Pick<DatasetNetworkSummary, "measureId" | "statisticId" | "sourceId">>,
) => {
  const stats = {
    total: networks.length,
    byStat: {} as Record<string, number>,
    byMeasure: {} as Record<string, number>,
    byMeasureStatisticSource: {} as Record<string, Record<string, Record<string, number>>>,
  };

  networks.forEach((network) => {
    stats.byStat[network.statisticId] = (stats.byStat[network.statisticId] ?? 0) + 1;
    stats.byMeasure[network.measureId] = (stats.byMeasure[network.measureId] ?? 0) + 1;

    const measureEntry = stats.byMeasureStatisticSource[network.measureId] ?? {};
    const statEntry = measureEntry[network.statisticId] ?? {};
    statEntry[network.sourceId] = (statEntry[network.sourceId] ?? 0) + 1;
    measureEntry[network.statisticId] = statEntry;
    stats.byMeasureStatisticSource[network.measureId] = measureEntry;
  });

  return stats;
};
