import type { ConnectivityCatalogs } from "@/types/catalogs";
import type {
  CONNECTIVITY_SCHEMA_VERSION,
  ConnectivityBundle,
  ConnectivityDataState,
  ConnectivityLoadResult,
  ConnectivityValidationOptions,
  MatrixRecord,
  ValidationResult,
} from "@/types/connectivityBundle";
import type { DatasetMeta } from "@/types/datasetState";
import type { ConnectivityMatrix } from "@/types/matrix";
import type { MatrixOrderItem } from "@/types/matrixOrder";
import { buildMatrixStats } from "@/utils/matrixStats";
import { validateAtlas } from "@/utils/connectivityAtlasValidation";
import { validateCatalogs } from "@/utils/connectivityCatalogValidation";
import { isNonEmptyString, isRecord } from "@/utils/connectivityGuards";
import { computeRoiOrderHash, materializeMatrixData } from "@/utils/connectivityMatrix";
import { computeMatrixDataStats } from "@/utils/matrixDataStats";
import { validateMatrixRecord } from "@/utils/connectivityMatrixValidation";
import {
  addError,
  createIssueBucket,
  resolveValidationOptions,
} from "@/utils/connectivityValidationTypes";

const schemaVersion = "fc-connectivity-v1.0";

const summaryFromPayload = (payload: unknown): ValidationResult["summary"] => {
  const catalogs = isRecord(payload) && isRecord(payload.catalogs) ? payload.catalogs : {};
  return {
    matrixCount: isRecord(payload) && Array.isArray(payload.matrices)
      ? payload.matrices.length
      : 0,
    populationCount: isRecord(catalogs.populations) ? Object.keys(catalogs.populations).length : 0,
    subjectCount: isRecord(catalogs.subjects) ? Object.keys(catalogs.subjects).length : 0,
    bandCount: isRecord(catalogs.bands) ? Object.keys(catalogs.bands).length : 0,
    measureCount: isRecord(catalogs.measures) ? Object.keys(catalogs.measures).length : 0,
  };
};

export const validateConnectivityBundle = (
  payload: unknown,
  options: ConnectivityValidationOptions = {},
): ValidationResult => {
  const resolvedOptions = resolveValidationOptions(options);
  const bucket = createIssueBucket();

  validateTopLevel(bucket, payload);
  if (!isRecord(payload)) return toResult(bucket, payload);

  if (isRecord(payload.atlas)) {
    const atlasResult = validateAtlas(payload.atlas);
    bucket.errors.push(...atlasResult.errors);
    bucket.warnings.push(...atlasResult.warnings);
  }
  if (isRecord(payload.catalogs)) {
    const catalogsResult = validateCatalogs(payload.catalogs);
    bucket.errors.push(...catalogsResult.errors);
    bucket.warnings.push(...catalogsResult.warnings);
  }

  if (bucket.errors.length > 0 || !Array.isArray(payload.matrices)) {
    return toResult(bucket, payload);
  }

  const bundle = payload as ConnectivityBundle;
  validateMatrixIds(bucket, bundle.matrices);
  for (const matrix of bundle.matrices) {
    const matrixResult = validateMatrixRecord(matrix, bundle, resolvedOptions);
    bucket.errors.push(...matrixResult.errors);
    bucket.warnings.push(...matrixResult.warnings);
  }

  return toResult(bucket, payload);
};

const validateTopLevel = (
  bucket: ReturnType<typeof createIssueBucket>,
  payload: unknown,
) => {
  if (!isRecord(payload)) {
    addError(bucket, "", "JSON root must be an object.");
    return;
  }
  if (payload.schemaVersion !== schemaVersion) {
    addError(bucket, "schemaVersion", `Invalid schemaVersion. Expected ${schemaVersion}.`);
  }
  if (!isRecord(payload.bundle)) addError(bucket, "bundle", "bundle is required.");
  else if (!isNonEmptyString(payload.bundle.id)) addError(bucket, "bundle.id", "bundle.id is required.");
  if (!isRecord(payload.atlas)) addError(bucket, "atlas", "atlas is required.");
  if (!isRecord(payload.catalogs)) addError(bucket, "catalogs", "catalogs is required.");
  if (!Array.isArray(payload.matrices)) addError(bucket, "matrices", "matrices must be an array.");
};

const validateMatrixIds = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrices: MatrixRecord[],
) => {
  const seen = new Set<string>();
  for (const matrix of matrices) {
    if (!isNonEmptyString(matrix.id)) continue;
    if (seen.has(matrix.id)) {
      addError(bucket, `matrices.${matrix.id}.id`, `Duplicate matrix.id '${matrix.id}'.`);
    }
    seen.add(matrix.id);
  }
};

export const loadConnectivityBundle = (
  payload: unknown,
  options: ConnectivityValidationOptions = {},
): ConnectivityLoadResult => {
  const validation = validateConnectivityBundle(payload, options);
  if (!validation.valid || !isRecord(payload)) {
    return {
      state: null,
      status: "blocked",
      errors: validation.errors,
      warnings: validation.warnings,
      summary: createLoadSummary(payload),
    };
  }

  const bundle = payload as ConnectivityBundle;
  const matrices = bundle.matrices.map((matrix) => ({
    ...matrix,
    dataStats: matrix.dataStats ?? computeMatrixDataStats(matrix),
  }));
  const matrixIndex = Object.fromEntries(
    matrices.map((matrix) => [matrix.id, matrix]),
  );
  const state: ConnectivityDataState = {
    schemaVersion: schemaVersion as typeof CONNECTIVITY_SCHEMA_VERSION,
    loadedBundle: bundle.bundle,
    atlas: bundle.atlas,
    roiOrderHash: computeRoiOrderHash(bundle.atlas),
    catalogs: bundle.catalogs,
    matrices,
    matrixIndex,
  };

  return {
    state,
    status: validation.warnings.length > 0 ? "loaded_with_warnings" : "loaded",
    warnings: validation.warnings,
    errors: [],
    summary: createLoadSummary(bundle),
  };
};

export const createDatasetMetaFromConnectivityState = (
  state: ConnectivityDataState,
): DatasetMeta => {
  const matrices = state.matrices.map(toStoredMatrix);
  return {
    metadata: {
      atlas: state.atlas.name,
      atlasId: state.atlas.id,
      matrixOrder: createMatrixOrder(state),
      maxPopulations: Math.max(
        1,
        ...state.matrices.map((matrix) => getMatrixPopulationIds(matrix).length),
      ),
    },
    catalogs: createAppCatalogs(state),
    matrixStats: buildMatrixStats(matrices),
    connectivity: state,
  };
};

export const createMatricesFromConnectivityState = (
  state: ConnectivityDataState,
): ConnectivityMatrix[] => state.matrices.map(toStoredMatrix);

const toStoredMatrix = (matrix: MatrixRecord): ConnectivityMatrix => ({
  id: matrix.id,
  bandId: matrix.context.bandId ?? "none",
  measureId: matrix.context.measureId,
  statId: matrix.stat.id,
  populationIds: getMatrixPopulationIds(matrix),
  data: materializeMatrixData(matrix),
  dataStats: matrix.dataStats ?? computeMatrixDataStats(matrix),
});

const getMatrixPopulationIds = (matrix: MatrixRecord): string[] => {
  if ("populationIds" in matrix.source) return matrix.source.populationIds;
  if (matrix.source.level === "comparison") {
    return [
      ...(matrix.source.left.populationIds ?? []),
      ...(matrix.source.right.populationIds ?? []),
    ];
  }
  return [];
};

const createAppCatalogs = (state: ConnectivityDataState): ConnectivityCatalogs => ({
  bands: Object.fromEntries(
    Object.values(state.catalogs.bands).map((band) => [
      band.id,
      {
        id: band.id,
        label: band.label,
        min: band.rangeHz[0],
        max: band.rangeHz[1],
        description: band.description ?? undefined,
        enabled: true,
      },
    ]),
  ),
  measures: Object.fromEntries(
    Object.values(state.catalogs.measures).map((measure) => [
      measure.id,
      {
        id: measure.id,
        label: measure.label,
        min: measure.expectedRange?.[0] ?? measure.valueDomain?.min ?? undefined,
        max: measure.expectedRange?.[1] ?? measure.valueDomain?.max ?? undefined,
        expectedRange: measure.expectedRange,
        description: measure.description ?? undefined,
        enabled: true,
      },
    ]),
  ),
  stats: Object.fromEntries(
    Object.values(state.catalogs.stats).map((stat) => [
      stat.id,
      {
        id: stat.id,
        label: stat.label,
        scaleType: stat.scaleType,
        center: stat.center,
        rangeMode: stat.rangeMode,
        expectedRange: stat.expectedRange,
        enabled: true,
      },
    ]),
  ),
  populations: Object.fromEntries(
    Object.values(state.catalogs.populations).map((population) => [
      population.id,
      {
        id: population.id,
        label: population.label,
        description: population.description ?? undefined,
        enabled: true,
      },
    ]),
  ),
});

const createMatrixOrder = (state: ConnectivityDataState): MatrixOrderItem[] =>
  [...state.atlas.rois]
    .sort((a, b) => a.index - b.index)
    .map((roi) => ({
      id: String(roi.id),
      label: roi.name,
      acronym: roi.label,
    }));

const createLoadSummary = (payload: unknown): ConnectivityLoadResult["summary"] => {
  if (!isRecord(payload)) {
    return { matrices: 0, bands: [], measures: [], populations: [], subjects: [] };
  }
  const catalogs = isRecord(payload.catalogs) ? payload.catalogs : {};
  return {
    bundleId: isRecord(payload.bundle) && isNonEmptyString(payload.bundle.id)
      ? payload.bundle.id
      : undefined,
    matrices: Array.isArray(payload.matrices) ? payload.matrices.length : 0,
    bands: isRecord(catalogs.bands) ? Object.keys(catalogs.bands) : [],
    measures: isRecord(catalogs.measures) ? Object.keys(catalogs.measures) : [],
    populations: isRecord(catalogs.populations) ? Object.keys(catalogs.populations) : [],
    subjects: isRecord(catalogs.subjects) ? Object.keys(catalogs.subjects) : [],
  };
};

const toResult = (
  bucket: ReturnType<typeof createIssueBucket>,
  payload: unknown,
): ValidationResult => ({
  valid: bucket.errors.length === 0,
  errors: bucket.errors,
  warnings: bucket.warnings,
  summary: summaryFromPayload(payload),
});
