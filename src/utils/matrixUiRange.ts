import type { ConnectivityCatalogs } from "@/types/catalogs";
import type {
  Catalogs,
  ExpectedRange,
  MatrixDataStats,
  MatrixDataStatsBucket,
  MatrixRecord,
  RangeMode,
  ScaleType,
  StatCatalogEntry,
  UiRangeMode,
} from "@/types/connectivityBundle";
import type { ConnectivityMatrix } from "@/types/matrix";
import { computeArrayMatrixDataStats } from "@/utils/matrixDataStats";

export type ResolveMatrixUiRangeOptions = {
  uiRangeMode?: UiRangeMode;
  target: "slider" | "colorLegend";
  observedDivergingMode?: "symmetric" | "raw";
};

export type ResolvedUiRange = {
  min: number;
  max: number;
  center: number | null;
  scaleType: ScaleType;
  source: "logical_default" | "observed";
  dataScope: "allValues";
};

type MatrixLike = MatrixRecord | ConnectivityMatrix;
type CatalogsLike = Catalogs | ConnectivityCatalogs | undefined;

const fallbackSequential: ExpectedRange = [0, 1];
const fallbackDiverging: ExpectedRange = [-1, 1];

const isMatrixRecord = (matrix: MatrixLike): matrix is MatrixRecord =>
  "context" in matrix && "stat" in matrix && "encoding" in matrix;

const getMeasureId = (matrix: MatrixLike) =>
  isMatrixRecord(matrix) ? matrix.context.measureId : matrix.measureId;

const getStatId = (matrix: MatrixLike) =>
  isMatrixRecord(matrix) ? matrix.stat.id : matrix.statId;

const getDataStats = (matrix: MatrixLike): MatrixDataStats =>
  matrix.dataStats ?? computeArrayMatrixDataStats(matrix.data as number[][]);

const normalizeRange = (range: ExpectedRange | undefined): ExpectedRange => {
  if (!range) return null;
  const [a, b] = range;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a <= b ? [a, b] : [b, a];
};

const hasNumberBounds = (
  entry: unknown,
): entry is { min?: number; max?: number } =>
  typeof entry === "object" && entry !== null && ("min" in entry || "max" in entry);

const hasValueDomain = (
  entry: unknown,
): entry is { valueDomain: { min: number; max: number } } =>
  typeof entry === "object" &&
  entry !== null &&
  "valueDomain" in entry &&
  typeof entry.valueDomain === "object" &&
  entry.valueDomain !== null &&
  "min" in entry.valueDomain &&
  "max" in entry.valueDomain &&
  Number.isFinite(entry.valueDomain.min) &&
  Number.isFinite(entry.valueDomain.max);

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
  if ("expectedRange" in measure) return normalizeRange(measure.expectedRange);
  if (hasValueDomain(measure)) {
    return normalizeRange([measure.valueDomain.min, measure.valueDomain.max]);
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

const inferRangeMode = (stat?: Partial<StatCatalogEntry>): RangeMode => {
  if (stat?.rangeMode) return stat.rangeMode;
  if (stat?.expectedRange) return "fixed";
  if (stat?.center === 0 || stat?.scaleType === "diverging") return "observed_symmetric";
  return stat && "useDataRange" in stat && stat.useDataRange ? "observed" : "inherit_measure";
};

const getStatConfig = (catalogs: CatalogsLike, statId: string) => {
  const stat = catalogs?.stats?.[statId] as Partial<StatCatalogEntry> | undefined;
  return {
    scaleType: inferScaleType(stat),
    center: stat?.center ?? null,
    rangeMode: inferRangeMode(stat),
  };
};

const observedRange = (bucket: MatrixDataStatsBucket): ExpectedRange =>
  bucket.min === null || bucket.max === null ? null : [bucket.min, bucket.max];

const withRange = (
  range: ExpectedRange,
  center: number | null,
  scaleType: ScaleType,
  source: ResolvedUiRange["source"],
  dataScope: ResolvedUiRange["dataScope"],
  fallback: ExpectedRange,
): ResolvedUiRange => {
  const [min, max] = normalizeRange(range) ?? (fallback as [number, number]);
  return { min, max, center, scaleType, source, dataScope };
};

const symmetricAroundCenter = (
  range: ExpectedRange,
  center: number,
): ExpectedRange => {
  if (!range) return null;
  const delta = Math.max(Math.abs(range[0] - center), Math.abs(range[1] - center));
  return [center - delta, center + delta];
};

export const resolveMatrixUiRange = (
  matrix: MatrixLike,
  catalogs: CatalogsLike,
  options: ResolveMatrixUiRangeOptions,
): ResolvedUiRange => {
  const {
    uiRangeMode = "logical_default",
    observedDivergingMode = "symmetric",
  } = options;
  const measureId = getMeasureId(matrix);
  const statId = getStatId(matrix);
  const stat = getStatConfig(catalogs, statId);
  const dataScope = "allValues";
  const statsBucket = getDataStats(matrix)[dataScope];
  const observed = observedRange(statsBucket);
  const measureExpected = getMeasureExpectedRange(catalogs, measureId);
  const statExpected = getStatExpectedRange(catalogs, statId);
  const center = stat.center ?? (stat.scaleType === "diverging" ? 0 : null);

  if (uiRangeMode === "observed") {
    if (stat.scaleType === "diverging") {
      const range =
        observedDivergingMode === "symmetric"
          ? symmetricAroundCenter(observed, center ?? 0)
          : observed;
      return withRange(
        range ?? statExpected ?? measureExpected,
        center,
        stat.scaleType,
        "observed",
        dataScope,
        fallbackDiverging,
      );
    }
    return withRange(
      observed ?? statExpected ?? measureExpected,
      center,
      stat.scaleType,
      "observed",
      dataScope,
      fallbackSequential,
    );
  }

  if (stat.rangeMode === "inherit_measure") {
    const range = measureExpected ?? observed;
    return withRange(
      range,
      center,
      stat.scaleType,
      "logical_default",
      dataScope,
      fallbackSequential,
    );
  }

  if (stat.rangeMode === "non_negative_observed") {
    return withRange(
      statsBucket.max === null ? null : [0, statsBucket.max],
      center,
      stat.scaleType,
      "logical_default",
      dataScope,
      fallbackSequential,
    );
  }

  if (stat.rangeMode === "observed_symmetric") {
    return withRange(
      symmetricAroundCenter(observed, center ?? 0),
      center,
      stat.scaleType,
      "logical_default",
      dataScope,
      fallbackDiverging,
    );
  }

  if (stat.rangeMode === "fixed") {
    return withRange(
      statExpected ?? measureExpected ?? observed,
      center,
      stat.scaleType,
      "logical_default",
      dataScope,
      stat.scaleType === "diverging" ? fallbackDiverging : fallbackSequential,
    );
  }

  return withRange(
    observed,
    center,
    stat.scaleType,
    "logical_default",
    dataScope,
    stat.scaleType === "diverging" ? fallbackDiverging : fallbackSequential,
  );
};
