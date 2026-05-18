import type {
  ConnectivityBundle,
  ConnectivityValidationOptions,
  MatrixCellValue,
  MatrixRecord,
  ValidationResult,
} from "@/types/connectivityBundle";
import {
  isFiniteNumber,
  isNonEmptyString,
  isPositiveInteger,
  isRecord,
} from "@/utils/connectivityGuards";
import { getExpectedDataLength, getMatrixValue } from "@/utils/connectivityMatrix";
import {
  addError,
  addWarning,
  createIssueBucket,
  resolveValidationOptions,
} from "@/utils/connectivityValidationTypes";

const matrixIdRegex = /^[A-Za-z0-9_-]+$/;

export const validateMatrixRecord = (
  matrix: unknown,
  bundle: ConnectivityBundle,
  options: ConnectivityValidationOptions = {},
): ValidationResult => {
  const resolvedOptions = resolveValidationOptions(options);
  const bucket = createIssueBucket();
  const record = matrix as MatrixRecord;
  const path = isRecord(matrix) && isNonEmptyString(matrix.id)
    ? `matrices.${matrix.id}`
    : "matrices[]";

  validateMatrixIdentity(bucket, matrix, path);
  if (!isRecord(matrix)) return toResult(bucket);

  validateContext(bucket, matrix, bundle, path);
  validateSource(bucket, matrix, bundle, path);
  validateStat(bucket, matrix, bundle, path);
  validateGeometry(bucket, matrix, bundle, path);
  validateEncoding(bucket, matrix, path, resolvedOptions.allowTriangularLayout);
  validateValueDomain(bucket, matrix, bundle, path);
  validateProvenance(bucket, matrix, path);
  validateComparison(bucket, matrix, bundle, path, resolvedOptions.allowMissingComparisonDependencies);

  if (bucket.errors.length === 0) {
    mergeDataValidation(bucket, validateMatrixDataShape(record), path);
    mergeDataValidation(bucket, validateMatrixSymmetry(record), path);
    mergeDataValidation(
      bucket,
      validateMatrixExpectedRanges(record, bundle, resolvedOptions.strictValueRanges),
      path,
    );
  }

  return toResult(bucket);
};

const validateMatrixIdentity = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrix: unknown,
  path: string,
) => {
  if (!isRecord(matrix)) {
    addError(bucket, path, "Matrix entry must be an object.");
    return;
  }
  if (!isNonEmptyString(matrix.id)) addError(bucket, `${path}.id`, "matrix.id is required.");
  if (isNonEmptyString(matrix.id) && !matrixIdRegex.test(matrix.id)) {
    addError(bucket, `${path}.id`, "matrix.id contains invalid characters.");
  }
  if (isNonEmptyString(matrix.id) && matrix.id.startsWith("__")) {
    addError(bucket, `${path}.id`, "matrix.id must not start with '__'.");
  }
  if (!["subject", "aggregate", "comparison", "reduced"].includes(String(matrix.kind))) {
    addError(bucket, `${path}.kind`, "matrix.kind must be subject, aggregate, comparison or reduced.");
  }
};

const validateContext = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrix: Record<string, unknown>,
  bundle: ConnectivityBundle,
  path: string,
) => {
  if (!isRecord(matrix.context)) {
    addError(bucket, `${path}.context`, "matrix.context is required.");
    return;
  }
  if (matrix.context.bandId !== null && !isNonEmptyString(matrix.context.bandId)) {
    addError(bucket, `${path}.context.bandId`, "context.bandId must be string or null.");
  }
  if (isNonEmptyString(matrix.context.bandId) && !bundle.catalogs.bands[matrix.context.bandId]) {
    addError(bucket, `${path}.context.bandId`, `Unknown bandId '${matrix.context.bandId}'.`);
  }
  if (!isNonEmptyString(matrix.context.measureId)) {
    addError(bucket, `${path}.context.measureId`, "context.measureId is required.");
  } else if (!bundle.catalogs.measures[matrix.context.measureId]) {
    addError(bucket, `${path}.context.measureId`, `Unknown measureId '${matrix.context.measureId}'.`);
  }
};

const validateSource = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrix: Record<string, unknown>,
  bundle: ConnectivityBundle,
  path: string,
) => {
  if (!isRecord(matrix.source)) {
    addError(bucket, `${path}.source`, "matrix.source is required.");
    return;
  }
  const expected = matrix.kind === "subject"
    ? "subject"
    : matrix.kind === "aggregate"
      ? "population"
      : matrix.kind === "comparison"
        ? "comparison"
        : matrix.kind === "reduced"
          ? "reduction"
        : null;
  if (expected && matrix.source.level !== expected) {
    addError(bucket, `${path}.source.level`, "source.level does not match matrix.kind.");
  }
  if (matrix.source.level === "subject") validateSubjectSource(bucket, matrix.source, bundle, path);
  if (matrix.source.level === "population") validatePopulationSource(bucket, matrix.source, bundle, path);
  if (matrix.source.level === "comparison") {
    if (!isRecord(matrix.source.left)) addError(bucket, `${path}.source.left`, "source.left is required.");
    if (!isRecord(matrix.source.right)) addError(bucket, `${path}.source.right`, "source.right is required.");
  }
  if (matrix.source.level === "reduction" && !isNonEmptyString(matrix.source.baseMatrixId)) {
    addError(bucket, `${path}.source.baseMatrixId`, "source.baseMatrixId is required for reduced matrices.");
  }
};

const validateSubjectSource = (
  bucket: ReturnType<typeof createIssueBucket>,
  source: Record<string, unknown>,
  bundle: ConnectivityBundle,
  path: string,
) => {
  if (!isNonEmptyString(source.subjectId) || !bundle.catalogs.subjects[source.subjectId]) {
    addError(bucket, `${path}.source.subjectId`, "source.subjectId must reference an existing subject.");
  }
  validatePopulationReferences(bucket, source.populationIds, bundle, `${path}.source.populationIds`, false);
};

const validatePopulationSource = (
  bucket: ReturnType<typeof createIssueBucket>,
  source: Record<string, unknown>,
  bundle: ConnectivityBundle,
  path: string,
) => {
  const ids = validatePopulationReferences(bucket, source.populationIds, bundle, `${path}.source.populationIds`, true);
  if (!isPositiveInteger(source.n)) {
    addError(bucket, `${path}.source.n`, "source.n must be integer > 0.");
    return;
  }
  if (ids.length === 1 && bundle.catalogs.populations[ids[0]]?.n !== source.n) {
    addError(bucket, `${path}.source.n`, "source.n must match the referenced population n.");
  }
};

const validatePopulationReferences = (
  bucket: ReturnType<typeof createIssueBucket>,
  value: unknown,
  bundle: ConnectivityBundle,
  path: string,
  requireNonEmpty: boolean,
) => {
  if (!Array.isArray(value) || (requireNonEmpty && value.length === 0)) {
    addError(bucket, path, "populationIds must be a string array.");
    return [];
  }
  const ids = value.filter((id): id is string => typeof id === "string");
  for (const id of value) {
    if (typeof id !== "string" || !bundle.catalogs.populations[id]) {
      addError(bucket, path, `Unknown populationId '${String(id)}'.`);
    }
  }
  return ids;
};

const validateStat = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrix: Record<string, unknown>,
  bundle: ConnectivityBundle,
  path: string,
) => {
  if (!isRecord(matrix.stat)) {
    addError(bucket, `${path}.stat`, "matrix.stat is required.");
    return;
  }
  if (!isNonEmptyString(matrix.stat.id) || !bundle.catalogs.stats[matrix.stat.id]) {
    addError(bucket, `${path}.stat.id`, "stat.id must reference an existing stat.");
  }
};

const validateGeometry = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrix: Record<string, unknown>,
  bundle: ConnectivityBundle,
  path: string,
) => {
  if (!isRecord(matrix.geometry)) {
    addError(bucket, `${path}.geometry`, "matrix.geometry is required.");
    return;
  }
  const shape = matrix.geometry.shape;
  if (matrix.geometry.atlasId !== bundle.atlas.id) {
    addError(bucket, `${path}.geometry.atlasId`, "geometry.atlasId must match bundle atlas.id.");
  }
  if (!Array.isArray(shape) || shape.length !== 2 || !shape.every(isPositiveInteger)) {
    addError(bucket, `${path}.geometry.shape`, "geometry.shape must be two positive integers.");
  } else if (matrix.kind !== "reduced" && (shape[0] !== bundle.atlas.rois.length || shape[1] !== bundle.atlas.rois.length)) {
    addError(bucket, `${path}.geometry.shape`, "geometry.shape must match atlas.rois length.");
  }
  if (matrix.kind === "reduced") {
    if (matrix.geometry.roiOrderRef !== null || !Array.isArray(matrix.geometry.roiOrder)) {
      addError(bucket, `${path}.geometry.roiOrder`, "reduced matrices must provide geometry.roiOrder and roiOrderRef=null.");
    }
    return;
  }
  if (matrix.geometry.roiOrderRef !== "atlas.rois" || matrix.geometry.roiOrder !== null) {
    addError(bucket, `${path}.geometry.roiOrderRef`, "v1.0 only supports roiOrderRef='atlas.rois' and roiOrder=null.");
  }
};

const validateEncoding = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrix: Record<string, unknown>,
  path: string,
  allowTriangularLayout: boolean,
) => {
  if (!isRecord(matrix.encoding)) {
    addError(bucket, `${path}.encoding`, "matrix.encoding is required.");
    return;
  }
  if (!["full", "upper_triangular", "lower_triangular"].includes(String(matrix.encoding.layout))) {
    addError(bucket, `${path}.encoding.layout`, "encoding.layout is invalid.");
  }
  if (!allowTriangularLayout && matrix.encoding.layout !== "full") {
    addError(bucket, `${path}.encoding.layout`, "triangular layout is disabled.");
  }
  if (!["float32", "float64"].includes(String(matrix.encoding.dtype))) {
    addError(bucket, `${path}.encoding.dtype`, "encoding.dtype is invalid.");
  }
  if (typeof matrix.encoding.symmetric !== "boolean") {
    addError(bucket, `${path}.encoding.symmetric`, "encoding.symmetric is required.");
  }
  if (matrix.encoding.layout !== "full" && matrix.encoding.symmetric === false) {
    addWarning(bucket, `${path}.encoding.symmetric`, "Triangular matrix uses symmetric=false.");
  }
};

const validateValueDomain = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrix: Record<string, unknown>,
  bundle: ConnectivityBundle,
  path: string,
) => {
  if (!isRecord(matrix.valueDomain)) {
    addError(bucket, `${path}.valueDomain`, "matrix.valueDomain is required.");
    return;
  }
  if (!isRecord(matrix.context) || !isNonEmptyString(matrix.context.measureId)) return;
  const measureRange = bundle.catalogs.measures[matrix.context.measureId]?.expectedRange;
  if (
    measureRange &&
    (matrix.valueDomain.min !== measureRange[0] || matrix.valueDomain.max !== measureRange[1])
  ) {
    addWarning(bucket, `${path}.valueDomain`, "Matrix valueDomain differs from measure expectedRange.");
  }
};

const validateProvenance = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrix: Record<string, unknown>,
  path: string,
) => {
  if (!isRecord(matrix.provenance)) {
    addError(bucket, `${path}.provenance`, "matrix.provenance is required.");
    return;
  }
  if (!isNonEmptyString(matrix.provenance.generatedBy)) {
    addError(bucket, `${path}.provenance.generatedBy`, "provenance.generatedBy is required.");
  }
  if (!Array.isArray(matrix.provenance.dependencies)) {
    addError(bucket, `${path}.provenance.dependencies`, "provenance.dependencies must be an array.");
  }
  if (!isRecord(matrix.provenance.parameters)) {
    addError(bucket, `${path}.provenance.parameters`, "provenance.parameters must be an object.");
  }
  if (matrix.provenance.createdAt === null) {
    addWarning(bucket, `${path}.provenance.createdAt`, "provenance.createdAt is null.");
  }
};

const validateComparison = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrix: Record<string, unknown>,
  bundle: ConnectivityBundle,
  path: string,
  allowMissingDependencies: boolean,
) => {
  if (matrix.kind !== "comparison") return;
  if (!isRecord(matrix.comparison)) {
    addError(bucket, `${path}.comparison`, "comparison is required for kind='comparison'.");
    return;
  }
  for (const field of ["operator", "comparisonType", "formula"] as const) {
    if (!isNonEmptyString(matrix.comparison[field])) {
      addError(bucket, `${path}.comparison.${field}`, `comparison.${field} is required.`);
    }
  }
  for (const field of ["leftMatrixId", "rightMatrixId"] as const) {
    const id = matrix.comparison[field];
    if (!isNonEmptyString(id)) {
      if (allowMissingDependencies) addWarning(bucket, `${path}.comparison.${field}`, `${field} is missing.`);
      continue;
    }
    if (!bundle.matrices.some((candidate) => candidate.id === id)) {
      const message = `${field} '${id}' is not present in this bundle.`;
      if (allowMissingDependencies) addWarning(bucket, `${path}.comparison.${field}`, message);
      else addError(bucket, `${path}.comparison.${field}`, message);
    }
  }
};

export const validateMatrixDataShape = (matrix: MatrixRecord): ValidationResult => {
  const bucket = createIssueBucket();
  const data = matrix.data;
  if (!Array.isArray(data)) addError(bucket, "data", "matrix.data is required.");
  else if (matrix.encoding.layout === "full") validateFullShape(bucket, matrix);
  else validateTriangularShape(bucket, matrix);
  return toResult(bucket);
};

const validateFullShape = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrix: MatrixRecord,
) => {
  const [rows, cols] = matrix.geometry.shape;
  if (!Array.isArray(matrix.data) || matrix.data.length !== rows) {
    addError(bucket, "data", `data must have ${rows} rows.`);
    return;
  }
  for (const [rowIndex, row] of (matrix.data as MatrixCellValue[][]).entries()) {
    if (!Array.isArray(row) || row.length !== cols) {
      addError(bucket, `data[${rowIndex}]`, `row must have ${cols} values.`);
      continue;
    }
    validateCells(bucket, row, `data[${rowIndex}]`);
  }
};

const validateTriangularShape = (
  bucket: ReturnType<typeof createIssueBucket>,
  matrix: MatrixRecord,
) => {
  const [rows, cols] = matrix.geometry.shape;
  if (rows !== cols) {
    addError(bucket, "geometry.shape", "triangular data requires a square shape.");
    return;
  }
  if (!Array.isArray(matrix.data) || matrix.data.length !== getExpectedDataLength(matrix)) {
    addError(bucket, "data", `triangular data must have ${getExpectedDataLength(matrix)} values.`);
    return;
  }
  validateCells(bucket, matrix.data as MatrixCellValue[], "data");
};

const isEmptyMatrixValue = (value: unknown) =>
  value === null || value === undefined || value === "";

const hasEmptyMatrixValues = (cells: readonly unknown[]) => {
  for (let index = 0; index < cells.length; index += 1) {
    if (!(index in cells) || isEmptyMatrixValue(cells[index])) return true;
  }
  return false;
};

const validateCells = (
  bucket: ReturnType<typeof createIssueBucket>,
  cells: readonly unknown[],
  path: string,
) => {
  if (hasEmptyMatrixValues(cells)) {
    addError(bucket, path, "Matrix data must not contain empty values.");
  }
  if (!cells.every((value) => isEmptyMatrixValue(value) || isFiniteNumber(value))) {
    addError(bucket, path, "Matrix data values must be finite numbers.");
  }
};

export const validateMatrixSymmetry = (matrix: MatrixRecord): ValidationResult => {
  const bucket = createIssueBucket();
  if (!matrix.encoding.symmetric || matrix.encoding.layout !== "full") return toResult(bucket);
  const [rows, cols] = matrix.geometry.shape;
  const tolerance = 1e-6;
  for (let i = 0; i < rows; i += 1) {
    for (let j = i + 1; j < cols; j += 1) {
      const a = getMatrixValue(matrix, i, j);
      const b = getMatrixValue(matrix, j, i);
      if (a === null || b === null) continue;
      if (Math.abs(a - b) > tolerance) {
        addError(bucket, "data", `Matrix is not symmetric at (${i}, ${j}).`);
        return toResult(bucket);
      }
    }
  }
  return toResult(bucket);
};

export const validateMatrixExpectedRanges = (
  matrix: MatrixRecord,
  bundle: ConnectivityBundle,
  strictValueRanges: boolean,
): ValidationResult => {
  const bucket = createIssueBucket();
  const measureRange = bundle.catalogs.measures[matrix.context.measureId]?.expectedRange;
  const stat = bundle.catalogs.stats[matrix.stat.id];
  const expectedRange =
    stat?.expectedRange ??
    (stat?.rangeMode === "inherit_measure" || stat?.rangeMode === "fixed"
      ? measureRange
      : null);
  if (!expectedRange) return toResult(bucket);

  const [min, max] = expectedRange;
  const [rows, cols] = matrix.geometry.shape;
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const value = getMatrixValue(matrix, i, j);
      if (value === null || !Number.isFinite(value)) continue;
      if (value < min || value > max) {
        const message = `Matrix value at (${i}, ${j}) is outside expectedRange [${min}, ${max}].`;
        if (strictValueRanges) addError(bucket, "data", message);
        else addWarning(bucket, "data", message);
        return toResult(bucket);
      }
    }
  }
  return toResult(bucket);
};

const mergeDataValidation = (
  bucket: ReturnType<typeof createIssueBucket>,
  result: ValidationResult,
  path: string,
) => {
  bucket.errors.push(
    ...result.errors.map((error) => ({ ...error, path: `${path}.${error.path}` })),
  );
  bucket.warnings.push(
    ...result.warnings.map((warning) => ({ ...warning, path: `${path}.${warning.path}` })),
  );
};

const toResult = (bucket: ReturnType<typeof createIssueBucket>): ValidationResult => ({
  valid: bucket.errors.length === 0,
  errors: bucket.errors,
  warnings: bucket.warnings,
  summary: {
    matrixCount: 0,
    populationCount: 0,
    subjectCount: 0,
    bandCount: 0,
    measureCount: 0,
  },
});
