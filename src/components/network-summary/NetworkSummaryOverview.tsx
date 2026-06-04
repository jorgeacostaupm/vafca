import type {
  NetworkSummaryFieldId,
  NetworkSummaryResult,
  NetworkSummarySettings,
} from "@/types/networkMeasures";

import {
  formatSummaryBoolean,
  formatSummaryNumber,
  formatSummaryPercent,
} from "./networkSummaryFormat";
import NetworkSummaryMetricGrid, {
  type NetworkSummaryMetricItem,
} from "./NetworkSummaryMetricGrid";

type Props = {
  summary: NetworkSummaryResult;
  settings: NetworkSummarySettings;
};

export default function NetworkSummaryOverview({ summary, settings }: Props) {
  const visible = (fieldId: NetworkSummaryFieldId) =>
    settings.visibleFields[fieldId]?.summaryTab ?? false;
  const item = (
    key: NetworkSummaryFieldId,
    label: string,
    value: string,
  ): NetworkSummaryMetricItem | null =>
    visible(key) ? { key, label, value } : null;

  const identityItems = [
    item("identity.matrixId", "Matrix ID", summary.identity.matrixId),
    item("identity.label", "Label", summary.identity.label),
    item("identity.kind", "Type", summary.identity.kind),
    item("identity.measure", "Measure", summary.identity.measureLabel),
    item("identity.statistic", "Statistic", summary.identity.statisticLabel),
    item("identity.layer", "Layer", summary.identity.layerLabel),
    item("identity.population", "Population", summary.identity.populationLabel),
    item("identity.matrixSize", "Matrix size", summary.identity.matrixSize),
    item(
      "identity.nodeCount",
      "Nodes",
      formatSummaryNumber(summary.identity.nodeCount),
    ),
    item(
      "identity.symmetric",
      "Symmetric",
      formatSummaryBoolean(summary.identity.symmetric),
    ),
    item(
      "identity.directed",
      "Directed",
      formatSummaryBoolean(summary.identity.directed),
    ),
    item("identity.networkKind", "Network kind", summary.identity.networkKind),
    item("identity.scope", "Scope", summary.identity.scope),
  ].filter((entry): entry is NetworkSummaryMetricItem => Boolean(entry));

  const coverageItems = [
    item(
      "coverage.nodeCount",
      "Nodes",
      formatSummaryNumber(summary.coverage.nodeCount),
    ),
    item(
      "coverage.possibleEdgeCount",
      "Possible links",
      formatSummaryNumber(summary.coverage.possibleEdgeCount),
    ),
    item(
      "coverage.evaluatedEdgeCount",
      "Evaluated links",
      formatSummaryNumber(summary.coverage.evaluatedEdgeCount),
    ),
    item(
      "coverage.usedEdgeCount",
      "Used links",
      formatSummaryNumber(summary.coverage.usedEdgeCount),
    ),
    item(
      "coverage.invalidEdgeCount",
      "Invalid links",
      formatSummaryNumber(summary.coverage.invalidEdgeCount),
    ),
    item(
      "coverage.zeroEdgeCount",
      "Zero links",
      formatSummaryNumber(summary.coverage.zeroEdgeCount),
    ),
    item("coverage.density", "Density", formatSummaryPercent(summary.coverage.density)),
    item("coverage.sparsity", "Sparsity", formatSummaryPercent(summary.coverage.sparsity)),
    item(
      "coverage.positiveEdgePercent",
      "Positive links",
      formatSummaryPercent(summary.coverage.positiveEdgePercent),
    ),
    item(
      "coverage.negativeEdgePercent",
      "Negative links",
      formatSummaryPercent(summary.coverage.negativeEdgePercent),
    ),
    item(
      "coverage.zeroEdgePercent",
      "Zero links",
      formatSummaryPercent(summary.coverage.zeroEdgePercent),
    ),
  ].filter((entry): entry is NetworkSummaryMetricItem => Boolean(entry));

  const weightItems = [
    item("weights.min", "Min", formatSummaryNumber(summary.weights.min)),
    item("weights.max", "Max", formatSummaryNumber(summary.weights.max)),
    item("weights.mean", "Mean", formatSummaryNumber(summary.weights.mean)),
    item("weights.median", "Median", formatSummaryNumber(summary.weights.median)),
    item(
      "weights.standardDeviation",
      "Std. deviation",
      formatSummaryNumber(summary.weights.standardDeviation),
    ),
    item("weights.meanAbs", "Mean absolute", formatSummaryNumber(summary.weights.meanAbs)),
    item("weights.sum", "Sum", formatSummaryNumber(summary.weights.sum)),
    item("weights.sumAbs", "Absolute sum", formatSummaryNumber(summary.weights.sumAbs)),
    item(
      "weights.sumPositive",
      "Positive sum",
      formatSummaryNumber(summary.weights.sumPositive),
    ),
    item(
      "weights.sumNegative",
      "Negative sum",
      formatSummaryNumber(summary.weights.sumNegative),
    ),
    item("weights.percentile05", "P05", formatSummaryNumber(summary.weights.percentile05)),
    item("weights.percentile25", "P25", formatSummaryNumber(summary.weights.percentile25)),
    item("weights.percentile50", "P50", formatSummaryNumber(summary.weights.percentile50)),
    item("weights.percentile75", "P75", formatSummaryNumber(summary.weights.percentile75)),
    item("weights.percentile95", "P95", formatSummaryNumber(summary.weights.percentile95)),
  ].filter((entry): entry is NetworkSummaryMetricItem => Boolean(entry));

  const globalItems = [
    item("global.meanDegree", "Mean degree", formatSummaryNumber(summary.global.meanDegree)),
    item("global.maxDegree", "Max degree", formatSummaryNumber(summary.global.maxDegree)),
    item(
      "global.componentCount",
      "Components",
      formatSummaryNumber(summary.global.componentCount),
    ),
    item(
      "global.giantComponentSize",
      "Giant component",
      formatSummaryNumber(summary.global.giantComponentSize),
    ),
    item(
      "global.giantComponentRatio",
      "Giant component ratio",
      formatSummaryPercent(summary.global.giantComponentRatio),
    ),
    item(
      "global.isolatedNodeCount",
      "Isolated nodes",
      formatSummaryNumber(summary.global.isolatedNodeCount),
    ),
    item(
      "global.meanClustering",
      "Mean clustering",
      formatSummaryNumber(summary.global.meanClustering),
    ),
    item(
      "global.transitivity",
      "Transitivity",
      formatSummaryNumber(summary.global.transitivity),
    ),
    item(
      "global.globalEfficiency",
      "Global efficiency",
      formatSummaryNumber(summary.global.globalEfficiency),
    ),
    item(
      "global.averagePathLength",
      "Average path length",
      formatSummaryNumber(summary.global.averagePathLength),
    ),
    item("global.diameter", "Diameter", formatSummaryNumber(summary.global.diameter)),
  ].filter((entry): entry is NetworkSummaryMetricItem => Boolean(entry));

  return (
    <>
      <NetworkSummaryMetricGrid title="Identity" items={identityItems} />
      <NetworkSummaryMetricGrid title="Coverage and density" items={coverageItems} />
      <NetworkSummaryMetricGrid title="Weight distribution" items={weightItems} />
      <NetworkSummaryMetricGrid title="Global network measures" items={globalItems} />
    </>
  );
}
