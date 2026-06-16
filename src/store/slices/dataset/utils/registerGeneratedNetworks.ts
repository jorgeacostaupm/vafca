import { getNetworkCalculationMethodDefinitions } from "@/networkDerivation/calculations/methods";
import type { NetworkCalculationOutputSpec } from "@/networkDerivation/calculations/types";
import type { DatasetState } from "@/types/datasetState";
import type { Network, Statistic } from "@/types/network";

import { networksAdapter } from "./networksAdapter";

const AGGREGATED_MEAN_STATISTIC: Statistic = {
  id: "mean",
  label: "Mean",
  category: "aggregation",
  scaleType: "sequential",
  center: null,
  rangeMode: "observed",
  enabled: true,
  useDataRange: true,
};

const outputByStatisticId = Object.fromEntries(
  getNetworkCalculationMethodDefinitions()
    .flatMap((definition) => [
      ...definition.outputs,
      ...(definition.associatedOutputs?.flatMap((item) => item.outputs) ?? []),
    ])
    .map((output) => [output.statId, output]),
) as Record<string, NetworkCalculationOutputSpec>;

const statisticFromOutput = (
  output: NetworkCalculationOutputSpec,
): Statistic => ({
  id: output.statId,
  label: output.statLabel,
  category: output.statCategory,
  description: output.description,
  scaleType: output.scaleType,
  center: output.center,
  rangeMode: output.rangeMode,
  expectedRange: output.expectedRange,
  enabled: true,
  useDataRange: output.useDataRange,
});

const registerGeneratedStatisticCatalogEntries = (
  state: DatasetState,
  networks: Network[],
) => {
  const { statistics } = state.catalogs ?? {};
  if (!statistics) return;

  networks.forEach((network) => {
    const output = outputByStatisticId[network.statisticId];
    if (output) {
      statistics[output.statId] = statisticFromOutput(output);
      return;
    }

    if (
      network.derivation?.type === "aggregation" &&
      network.statisticId === AGGREGATED_MEAN_STATISTIC.id
    ) {
      statistics[AGGREGATED_MEAN_STATISTIC.id] = AGGREGATED_MEAN_STATISTIC;
    }
  });
};

const registerAggregatedLayerCatalogEntries = (
  state: DatasetState,
  networks: Network[],
) => {
  const { catalogs } = state;
  if (!catalogs) return;

  networks.forEach((network) => {
    if (network.derivation?.type !== "aggregation") return;
    const layerId = network.context.layerId;
    if (!layerId) return;

    const baseNetwork = state.networks.entities[network.derivation.baseNetworkId];
    const baseLayerId = baseNetwork?.context.layerId ?? null;
    const baseLayerLabel =
      (baseLayerId ? catalogs.layers[baseLayerId]?.label : undefined) ??
      baseLayerId ??
      "No layer";
    const groupingLabel = network.derivation.fields.join(" / ") || "node groups";

    catalogs.layers[layerId] = {
      id: layerId,
      label: `${baseLayerLabel} by ${groupingLabel}`,
      description: `Visualization-only layer derived from ${baseLayerLabel}.`,
      enabled: true,
    };
  });
};

export const registerGeneratedNetworksInDataset = (
  state: DatasetState,
  networks: Network[],
) => {
  networksAdapter.upsertMany(state.networks, networks);
  registerGeneratedStatisticCatalogEntries(state, networks);
  registerAggregatedLayerCatalogEntries(state, networks);
};
