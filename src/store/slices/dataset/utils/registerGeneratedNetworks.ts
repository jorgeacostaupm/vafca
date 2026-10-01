import { absoluteCalculationOutput } from "@/networkDerivation/calculations/absoluteDifference";
import { getNetworkCalculationMethodDefinitions } from "@/networkDerivation/calculations/methods";
import type { NetworkCalculationOutputSpec } from "@/networkDerivation/calculations/types";
import type { DatasetState } from "@/types/datasetState";
import type { Network, Source, Statistic } from "@/types/network";

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
    .flatMap((output) => [output, absoluteCalculationOutput(output)])
    .map((output) => [output.statisticId, output]),
) as Record<string, NetworkCalculationOutputSpec>;

const statisticFromOutput = (
  output: NetworkCalculationOutputSpec,
): Statistic => ({
  id: output.statisticId,
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
      statistics[output.statisticId] = statisticFromOutput(output);
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

const labelForSource = (state: DatasetState, sourceId: string) =>
  state.catalogs?.sources[sourceId]?.label ?? sourceId;

const sourceFromComparisonNetwork = (
  state: DatasetState,
  network: Network,
): Source | null => {
  if (network.derivation?.type !== "comparison") return null;
  const parameters = network.derivation.parameters as Record<string, unknown>;
  const left = typeof parameters.left === "string" ? parameters.left : null;
  const right = typeof parameters.right === "string" ? parameters.right : null;
  if (!left || !right) return null;
  return {
    id: network.sourceId,
    label: `${labelForSource(state, left)} vs ${typeof parameters.rightLabel === "string" ? parameters.rightLabel : labelForSource(state, right)}${typeof parameters.inputStatisticsLabel === "string" ? ` · ${parameters.inputStatisticsLabel}` : ""}`,
    kind: "comparison",
    left,
    right,
    enabled: true,
  };
};

const registerGeneratedSourceCatalogEntries = (
  state: DatasetState,
  networks: Network[],
) => {
  const { catalogs } = state;
  if (!catalogs) return;

  networks.forEach((network) => {
    if (catalogs.sources[network.sourceId]) return;
    const source = sourceFromComparisonNetwork(state, network);
    if (source) catalogs.sources[source.id] = source;
  });
};

export const registerGeneratedNetworksInDataset = (
  state: DatasetState,
  networks: Network[],
) => {
  networksAdapter.upsertMany(state.networks, networks);
  registerGeneratedStatisticCatalogEntries(state, networks);
  registerGeneratedSourceCatalogEntries(state, networks);
};
