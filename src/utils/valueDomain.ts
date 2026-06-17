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
import { computeNetworkMatrixDataStats } from "@/utils/networkDataStats";

type NetworkLike = Network | MaterializedNetworkView;
type CatalogsLike = Catalogs | undefined;

type ResolveValueDomainArgs = {
  network: NetworkLike;
  catalogs: CatalogsLike;
  mode: UiRangeMode;
  observedData?: number[][];
};

const FALLBACK_SEQUENTIAL: ValueRange = [0, 1];
const FALLBACK_DIVERGING: ValueRange = [-1, 1];

const isNetwork = (network: NetworkLike): network is Network =>
  "source" in network && "statisticId" in network;

const getMeasureId = (network: NetworkLike) =>
  isNetwork(network) ? network.measureId : network.measureId;

const getStatisticId = (network: NetworkLike) =>
  isNetwork(network) ? network.statisticId : network.statId;

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

const inferScaleType = (statistic?: { scaleType?: ScaleType; center?: number | null }) => {
  if (statistic?.scaleType) return statistic.scaleType;
  return statistic?.center === 0 ? "diverging" : "sequential";
};

const getStatisticConfig = (catalogs: CatalogsLike, statisticId: string) => {
  const statistic = catalogs?.statistics?.[statisticId];
  const scaleType = inferScaleType(statistic);
  return {
    scaleType,
    center: statistic?.center ?? (scaleType === "diverging" ? 0 : null),
  };
};

const getNetworkDataStats = (network: NetworkLike): NetworkDataStats =>
  network.dataStats ??
  computeNetworkMatrixDataStats((isNetwork(network) ? [] : network.data) as number[][]);

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

const resolveObservedRange = (
  network: NetworkLike,
  observedData: number[][] | undefined,
): ValueRange | null => {
  const stats = observedData
    ? computeNetworkMatrixDataStats(observedData)
    : getNetworkDataStats(network);
  return observedRange(stats.allValues);
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
  observedData,
}: ResolveValueDomainArgs): ResolvedValueDomain => {
  const measureId = getMeasureId(network);
  const statisticId = getStatisticId(network);
  const statistic = getStatisticConfig(catalogs, statisticId);
  const center = statistic.center;
  const observed = resolveObservedRange(network, observedData);
  const statisticExpected = getStatisticExpectedRange(catalogs, statisticId);
  const measureExpected = getMeasureExpectedRange(catalogs, measureId);
  const fallback =
    statistic.scaleType === "diverging" ? FALLBACK_DIVERGING : FALLBACK_SEQUENTIAL;

  if (mode === "catalog") {
    const catalogRange = statisticExpected ?? measureExpected;
    const fallbackObserved =
      statistic.scaleType === "diverging" && center !== null
        ? symmetricAroundCenter(observed, center)
        : observed;
    return toDomain({
      range: catalogRange ?? fallbackObserved,
      center,
      scaleType: statistic.scaleType,
      mode,
      source: catalogRange ? "catalog" : fallbackObserved ? "view_observed" : "fallback",
      fallback,
      symmetric: !catalogRange && Boolean(fallbackObserved) && statistic.scaleType === "diverging",
    });
  }

  const symmetric = statistic.scaleType === "diverging" && center !== null;
  const catalogFallback = statisticExpected ?? measureExpected;
  return toDomain({
    range: symmetric ? symmetricAroundCenter(observed, center) : observed,
    center,
    scaleType: statistic.scaleType,
    mode,
    source: observed ? "view_observed" : catalogFallback ? "catalog" : "fallback",
    fallback: catalogFallback ?? fallback,
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
