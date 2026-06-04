import type { NetworkWeightDistribution } from "@/types/networkMeasures";

const toSortedFiniteValues = (values: number[]) =>
  values.filter(Number.isFinite).sort((left, right) => left - right);

export const mean = (values: number[]) =>
  values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

export const percentile = (values: number[], p: number) => {
  const sorted = toSortedFiniteValues(values);
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];

  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];

  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

export const buildWeightDistribution = (
  values: number[],
): NetworkWeightDistribution => {
  const finite = values.filter(Number.isFinite);
  const average = mean(finite);
  const sum = finite.reduce((acc, value) => acc + value, 0);
  const sumAbs = finite.reduce((acc, value) => acc + Math.abs(value), 0);
  const sumPositive = finite
    .filter((value) => value > 0)
    .reduce((acc, value) => acc + value, 0);
  const sumNegative = finite
    .filter((value) => value < 0)
    .reduce((acc, value) => acc + value, 0);
  const variance =
    average === null
      ? null
      : finite.reduce((acc, value) => acc + (value - average) ** 2, 0) /
        finite.length;

  return {
    min: finite.length > 0 ? Math.min(...finite) : null,
    max: finite.length > 0 ? Math.max(...finite) : null,
    mean: average,
    median: percentile(finite, 0.5),
    standardDeviation: variance === null ? null : Math.sqrt(variance),
    meanAbs: mean(finite.map(Math.abs)),
    sum,
    sumAbs,
    sumPositive,
    sumNegative,
    percentile05: percentile(finite, 0.05),
    percentile25: percentile(finite, 0.25),
    percentile50: percentile(finite, 0.5),
    percentile75: percentile(finite, 0.75),
    percentile95: percentile(finite, 0.95),
  };
};
