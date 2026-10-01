import type { MaterializedNetworkView } from "@/types/datasetNetworkView";
import type {
  Catalogs,
  Network,
  NetworkDataStats,
  NetworkDataStatsBucket,
  ScaleType,
  UiRangeMode,
  ValueRange,
} from "@/types/network";
import type { ResolvedValueDomain } from "@/types/valueDomain";
import { computeNetworkDataStats, computeNetworkMatrixDataStats } from "@/utils/networkDataStats";

type NetworkLike = Network | MaterializedNetworkView;
type CatalogsLike = Catalogs | undefined;

type ResolveValueDomainArgs = {
  network: NetworkLike;
  catalogs: CatalogsLike;
  mode: UiRangeMode;
};

const FALLBACK_SEQUENTIAL: ValueRange = [0, 1];
const FALLBACK_DIVERGING: ValueRange = [-1, 1];

const isNetwork = (network: NetworkLike): network is Network =>
  !Array.isArray(network.data);

const getMeasureId = (network: NetworkLike) =>
  isNetwork(network) ? network.measureId : network.measureId;

const getStatisticId = (network: NetworkLike) =>
  isNetwork(network) ? network.statisticId : network.statisticId;

const normalizeRange = (range: ValueRange | null | undefined): ValueRange | null => {
  if (!range) return null;
  const [a, b] = range;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a <= b ? [a, b] : [b, a];
};

const expandFlatRange = (range: ValueRange): ValueRange => {
  const [min, max] = range;
  if (min !== max) return range;
  const delta = Math.abs(min) > 0 ? Math.abs(min) * 0.05 : 1;
  return [min - delta, max + delta];
};

const expectedRangeFromBounds = (entry?: { min?: number; max?: number }) =>
  normalizeRange(
    Number.isFinite(entry?.min) && Number.isFinite(entry?.max)
      ? [entry?.min as number, entry?.max as number]
      : null,
  );

const getMeasureExpectedRange = (
  catalogs: CatalogsLike,
  measureId: string,
): ValueRange | null => {
  const measure = catalogs?.measures?.[measureId];
  if (!measure) return null;
  const expectedRange = normalizeRange(measure.expectedRange);
  if (expectedRange) return expectedRange;
  const domainMin = measure.valueDomain?.min;
  const domainMax = measure.valueDomain?.max;
  if (Number.isFinite(domainMin) && Number.isFinite(domainMax)) {
    return normalizeRange([domainMin as number, domainMax as number]);
  }
  return expectedRangeFromBounds(measure);
};

const getStatisticExpectedRange = (
  catalogs: CatalogsLike,
  statisticId: string,
): ValueRange | null => {
  const statistic = catalogs?.statistics?.[statisticId];
  if (!statistic) return null;
  return normalizeRange(statistic.expectedRange) ?? expectedRangeFromBounds(statistic);
};

const getStatisticConfig = (
  catalogs: CatalogsLike,
  statisticId: string,
  range: ValueRange | null,
) => {
  const statistic = catalogs?.statistics?.[statisticId];
  const scaleType: ScaleType = range
    ? range[0] < 0 && range[1] > 0 ? "diverging" : "sequential"
    : statistic?.scaleType ?? (statistic?.center === 0 ? "diverging" : "sequential");
  return {
    scaleType,
    center: scaleType === "diverging" ? (range ? 0 : statistic?.center ?? 0) : null,
  };
};

export const getNetworkDataStats = (network: NetworkLike): NetworkDataStats =>
  network.dataStats ??
  (isNetwork(network)
    ? computeNetworkDataStats(network)
    : computeNetworkMatrixDataStats(network.data));

const observedRange = (bucket: NetworkDataStatsBucket): ValueRange | null =>
  bucket.min === null || bucket.max === null ? null : [bucket.min, bucket.max];

const symmetricAroundCenter = (
  range: ValueRange | null,
  center: number,
): ValueRange | null => {
  if (!range) return null;
  const delta = Math.max(Math.abs(range[0] - center), Math.abs(range[1] - center));
  return [center - delta, center + delta];
};


const toDomain = ({
  range,
  center,
  scaleType,
  mode,
  source,
  fallback,
  symmetric,
}: {
  range: ValueRange | null;
  center: number | null;
  scaleType: ScaleType;
  mode: UiRangeMode;
  source: ResolvedValueDomain["source"];
  fallback: ValueRange;
  symmetric: boolean;
}): ResolvedValueDomain => {
  const normalized = normalizeRange(range) ?? fallback;
  const [min, max] = expandFlatRange(normalized);
  return { min, max, center, scaleType, mode, source, symmetric };
};

export const resolveValueDomain = ({
  network,
  catalogs,
  mode,
}: ResolveValueDomainArgs): ResolvedValueDomain => {
  const measureId = getMeasureId(network);
  const statisticId = getStatisticId(network);
  const observed = observedRange(getNetworkDataStats(network).allValues);
  const statisticExpected = getStatisticExpectedRange(catalogs, statisticId);
  if (!statisticExpected && catalogs?.statistics[statisticId]?.rangeMode === "non_negative_observed") {
    return {
      min: 0,
      max: observed && observed[1] > 0 ? observed[1] : FALLBACK_SEQUENTIAL[1],
      center: null,
      scaleType: "sequential",
      mode,
      source: observed ? "view_observed" : "fallback",
      symmetric: false,
    };
  }
  if (!statisticExpected && catalogs?.statistics[statisticId]?.rangeMode === "observed_symmetric") {
    return toDomain({
      range: symmetricAroundCenter(observed, 0),
      center: 0,
      scaleType: "diverging",
      mode,
      source: observed ? "view_observed" : "fallback",
      fallback: FALLBACK_DIVERGING,
      symmetric: true,
    });
  }
  const measureExpected = getMeasureExpectedRange(catalogs, measureId);
  const statistic = getStatisticConfig(catalogs, statisticId, statisticExpected ?? measureExpected);
  const center = statistic.center;
  const fallback =
    statistic.scaleType === "diverging" ? FALLBACK_DIVERGING : FALLBACK_SEQUENTIAL;

  const symmetric = statistic.scaleType === "diverging" && center !== null;
  return toDomain({
    range: symmetric ? symmetricAroundCenter(observed, center) : observed,
    center,
    scaleType: statistic.scaleType,
    mode,
    source: observed ? "view_observed" : "fallback",
    fallback,
    symmetric,
  });
};

export const isDivergingDomain = (domain: ResolvedValueDomain) =>
  domain.scaleType === "diverging" && domain.center !== null;

export const buildSplitRangeFromDomain = (domain: ResolvedValueDomain) => {
  const center = domain.center ?? 0;
  if (!isDivergingDomain(domain) || domain.min >= center || domain.max <= center) {
    return [domain.min, domain.max] as [number, number];
  }

  return {
    negative: [domain.min, center] as [number, number],
    positive: [center, domain.max] as [number, number],
  };
};
