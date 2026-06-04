import type {
  Catalogs,
  ConnectivityMatrix,
  ExpectedRange,
  MatrixDataStats,
  MatrixDataStatsBucket,
  MatrixViewData,
  ScaleType,
  StatCatalogEntry,
  UiRangeMode,
} from "@/types/connectivityBundle";
import type { ResolvedValueDomain } from "@/types/valueDomain";
import { computeArrayMatrixDataStats } from "@/utils/matrixDataStats";

type MatrixLike = ConnectivityMatrix | MatrixViewData;
type CatalogsLike = Catalogs | undefined;

type ResolveValueDomainArgs = {
  matrix: MatrixLike;
  catalogs: CatalogsLike;
  mode: UiRangeMode;
  observedData?: number[][];
};

const FALLBACK_SEQUENTIAL: ExpectedRange = [0, 1];
const FALLBACK_DIVERGING: ExpectedRange = [-1, 1];

const isConnectivityMatrix = (matrix: MatrixLike): matrix is ConnectivityMatrix =>
  "context" in matrix && "stat" in matrix && "encoding" in matrix;

const getMeasureId = (matrix: MatrixLike) =>
  isConnectivityMatrix(matrix) ? matrix.context.measureId : matrix.measureId;

const getStatId = (matrix: MatrixLike) =>
  isConnectivityMatrix(matrix) ? matrix.stat.id : matrix.statId;

const normalizeRange = (range: ExpectedRange | undefined): ExpectedRange => {
  if (!range) return null;
  const [a, b] = range;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a <= b ? [a, b] : [b, a];
};

const expandFlatRange = (range: [number, number]): [number, number] => {
  const [min, max] = range;
  if (min !== max) return range;
  const delta = Math.abs(min) > 0 ? Math.abs(min) * 0.05 : 1;
  return [min - delta, max + delta];
};

const hasNumberBounds = (
  entry: unknown,
): entry is { min?: number; max?: number } =>
  typeof entry === "object" && entry !== null && ("min" in entry || "max" in entry);

const expectedRangeFromBounds = (entry?: { min?: number; max?: number }) =>
  normalizeRange(
    Number.isFinite(entry?.min) && Number.isFinite(entry?.max)
      ? [entry?.min as number, entry?.max as number]
      : null,
  );

const getMeasureExpectedRange = (
  catalogs: CatalogsLike,
  measureId: string,
): ExpectedRange => {
  const measure = catalogs?.measures?.[measureId];
  if (!measure) return null;
  const expectedRange = normalizeRange(measure.expectedRange);
  if (expectedRange) return expectedRange;
  const domainMin = measure.valueDomain?.min;
  const domainMax = measure.valueDomain?.max;
  if (Number.isFinite(domainMin) && Number.isFinite(domainMax)) {
    return normalizeRange([domainMin as number, domainMax as number]);
  }
  return hasNumberBounds(measure) ? expectedRangeFromBounds(measure) : null;
};

const getStatExpectedRange = (
  catalogs: CatalogsLike,
  statId: string,
): ExpectedRange => {
  const stat = catalogs?.stats?.[statId];
  if (!stat) return null;
  if ("expectedRange" in stat) return normalizeRange(stat.expectedRange);
  return hasNumberBounds(stat) ? expectedRangeFromBounds(stat) : null;
};

const inferScaleType = (stat?: Partial<StatCatalogEntry>): ScaleType => {
  if (stat?.scaleType) return stat.scaleType;
  return stat?.center === 0 ? "diverging" : "sequential";
};

const getStatConfig = (catalogs: CatalogsLike, statId: string) => {
  const stat = catalogs?.stats?.[statId] as Partial<StatCatalogEntry> | undefined;
  const scaleType = inferScaleType(stat);
  return {
    scaleType,
    center: stat?.center ?? (scaleType === "diverging" ? 0 : null),
  };
};

const getMatrixDataStats = (matrix: MatrixLike): MatrixDataStats =>
  matrix.dataStats ?? computeArrayMatrixDataStats(matrix.data as number[][]);

const observedRange = (bucket: MatrixDataStatsBucket): ExpectedRange =>
  bucket.min === null || bucket.max === null ? null : [bucket.min, bucket.max];

const symmetricAroundCenter = (
  range: ExpectedRange,
  center: number,
): ExpectedRange => {
  if (!range) return null;
  const delta = Math.max(Math.abs(range[0] - center), Math.abs(range[1] - center));
  return [center - delta, center + delta];
};

const resolveObservedRange = (
  matrix: MatrixLike,
  observedData: number[][] | undefined,
): ExpectedRange => {
  const stats = observedData
    ? computeArrayMatrixDataStats(observedData)
    : getMatrixDataStats(matrix);
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
  range: ExpectedRange;
  center: number | null;
  scaleType: ScaleType;
  mode: UiRangeMode;
  source: ResolvedValueDomain["source"];
  fallback: ExpectedRange;
  symmetric: boolean;
}): ResolvedValueDomain => {
  const normalized = normalizeRange(range) ?? (fallback as [number, number]);
  const [min, max] = expandFlatRange(normalized);
  return { min, max, center, scaleType, mode, source, symmetric };
};

export const resolveValueDomain = ({
  matrix,
  catalogs,
  mode,
  observedData,
}: ResolveValueDomainArgs): ResolvedValueDomain => {
  const measureId = getMeasureId(matrix);
  const statId = getStatId(matrix);
  const stat = getStatConfig(catalogs, statId);
  const center = stat.center;
  const observed = resolveObservedRange(matrix, observedData);
  const statExpected = getStatExpectedRange(catalogs, statId);
  const measureExpected = getMeasureExpectedRange(catalogs, measureId);
  const fallback =
    stat.scaleType === "diverging" ? FALLBACK_DIVERGING : FALLBACK_SEQUENTIAL;

  if (mode === "catalog") {
    const catalogRange = statExpected ?? measureExpected;
    const fallbackObserved =
      stat.scaleType === "diverging" && center !== null
        ? symmetricAroundCenter(observed, center)
        : observed;
    return toDomain({
      range: catalogRange ?? fallbackObserved,
      center,
      scaleType: stat.scaleType,
      mode,
      source: catalogRange ? "catalog" : fallbackObserved ? "view_observed" : "fallback",
      fallback,
      symmetric: !catalogRange && Boolean(fallbackObserved) && stat.scaleType === "diverging",
    });
  }

  const symmetric = stat.scaleType === "diverging" && center !== null;
  const catalogFallback = statExpected ?? measureExpected;
  return toDomain({
    range: symmetric ? symmetricAroundCenter(observed, center) : observed,
    center,
    scaleType: stat.scaleType,
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
