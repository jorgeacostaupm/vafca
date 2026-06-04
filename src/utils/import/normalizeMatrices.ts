import type { MatrixLayout } from "@/types/connectivityBundle";
import { isNonEmptyString, isRecord, toSlug } from "@/utils/import/guards";
import { parseMatrixImportRecord } from "@/utils/import/schemas/matrixSchema";
import type {
  ConnectivityImportIssue,
  NormalizedImportInference,
  NormalizedMatrix,
  RawZipMatrixFile,
} from "@/utils/import/types";

const UNKNOWN_IMPORT_METADATA = "Unknown";

type MatrixMetadataFallbacks = {
  symmetric: boolean;
};

type NormalizeMatricesArgs = {
  matrixFiles: RawZipMatrixFile[];
  fallbacks: MatrixMetadataFallbacks;
  errors: ConnectivityImportIssue[];
  warnings: ConnectivityImportIssue[];
  inference: NormalizedImportInference;
  strict: boolean;
};

const getOptionalString = (
  record: Record<string, unknown>,
  keys: string[],
) => {
  for (const key of keys) {
    const value = record[key];
    if (isNonEmptyString(value)) return value.trim();
  }
  return null;
};

const getPopulationIds = (
  record: Record<string, unknown>,
  fallback: string,
) => {
  if (Array.isArray(record.populationIds)) {
    const ids = record.populationIds.filter(isNonEmptyString).map((id) => id.trim());
    if (ids.length > 0) return ids;
  }
  const population = getOptionalString(record, ["population", "populationId"]);
  return [population ?? fallback];
};

const getSubjectId = (
  record: Record<string, unknown>,
  fallback: string,
) => getOptionalString(record, ["subject", "subjectId"]) ?? fallback;

const getMatrixKind = (record: Record<string, unknown>) =>
  record.kind === "subject"
    ? "subject"
    : record.kind === "comparison" || isRecord(record.comparison)
      ? "comparison"
      : "population";

const getComparison = (
  record: Record<string, unknown>,
  populationIds: string[],
) => {
  if (!isRecord(record.comparison)) {
    return {
      left: populationIds[0] ?? "left",
      right: populationIds[1] ?? "right",
      comparisonType: "comparison",
    };
  }

  return {
    left: getOptionalString(record.comparison, ["left", "leftPopulation"]) ??
      populationIds[0] ??
      "left",
    right: getOptionalString(record.comparison, ["right", "rightPopulation"]) ??
      populationIds[1] ??
      "right",
    comparisonType: getOptionalString(record.comparison, ["type", "comparisonType"]) ??
      "comparison",
  };
};

const getMatrixLayout = (record: Record<string, unknown>): MatrixLayout => {
  const raw = getOptionalString(record, ["layout", "matrixType", "type"]);
  if (
    raw === "full" ||
    raw === "upper_triangular" ||
    raw === "lower_triangular"
  ) {
    return raw;
  }
  return "full";
};

const normalizeCell = (
  value: unknown,
  source: string,
  path: string,
  errors: ConnectivityImportIssue[],
) => {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push({
      source,
      path,
      message: "Matrix values must be finite numbers or null.",
    });
    return undefined;
  }
  return value;
};

const triangularSizeFromLength = (length: number) => {
  const size = (Math.sqrt(8 * length + 1) - 1) / 2;
  return Number.isInteger(size) ? size : null;
};

const materializeTriangularData = (
  values: (number | null)[],
  size: number,
  layout: Exclude<MatrixLayout, "full">,
  symmetric: boolean,
) => {
  const data = Array.from({ length: size }, () =>
    Array.from<number | null>({ length: size }).fill(null),
  );
  let valueIndex = 0;

  if (layout === "upper_triangular") {
    for (let row = 0; row < size; row += 1) {
      for (let column = row; column < size; column += 1) {
        const value = values[valueIndex];
        data[row][column] = value;
        if (symmetric) data[column][row] = value;
        valueIndex += 1;
      }
    }
    return data;
  }

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      const value = values[valueIndex];
      data[row][column] = value;
      if (symmetric) data[column][row] = value;
      valueIndex += 1;
    }
  }
  return data;
};

const normalizeMatrixData = (
  data: unknown,
  layout: MatrixLayout,
  symmetric: boolean,
  source: string,
  errors: ConnectivityImportIssue[],
) => {
  if (!Array.isArray(data) || data.length === 0) {
    errors.push({
      source,
      path: `${source}.data`,
      message: layout === "full"
        ? "Matrix data must be a non-empty square array."
        : "Triangular matrix data must be a non-empty array.",
    });
    return null;
  }

  if (layout !== "full") {
    if (data.some(Array.isArray)) {
      errors.push({
        source,
        path: `${source}.data`,
        message: "Triangular matrix data must be a flat array including the diagonal.",
      });
      return null;
    }

    const size = triangularSizeFromLength(data.length);
    if (size === null) {
      errors.push({
        source,
        path: `${source}.data`,
        message: "Triangular matrix data length must match n*(n+1)/2.",
      });
      return null;
    }

    const values: (number | null)[] = [];
    for (const [index, value] of data.entries()) {
      const cell = normalizeCell(value, source, `${source}.data[${index}]`, errors);
      if (cell === undefined) return null;
      values.push(cell);
    }
    return materializeTriangularData(values, size, layout, symmetric);
  }

  const size = data.length;
  const rows: (number | null)[][] = [];
  for (const [rowIndex, row] of data.entries()) {
    if (!Array.isArray(row) || row.length !== size) {
      errors.push({
        source,
        path: `${source}.data[${rowIndex}]`,
        message: `Row must contain exactly ${size} values.`,
      });
      return null;
    }

    const normalizedRow: (number | null)[] = [];
    for (const [columnIndex, value] of row.entries()) {
      const cell = normalizeCell(
        value,
        source,
        `${source}.data[${rowIndex}][${columnIndex}]`,
        errors,
      );
      if (cell === undefined) return null;
      normalizedRow.push(cell);
    }
    rows.push(normalizedRow);
  }

  return rows;
};

const computeValueDomain = (data: (number | null)[][]) => {
  let min: number | null = null;
  let max: number | null = null;

  data.forEach((row) => {
    row.forEach((value) => {
      if (value === null) return;
      min = min === null ? value : Math.min(min, value);
      max = max === null ? value : Math.max(max, value);
    });
  });

  return {
    min,
    max,
    center: min !== null && max !== null && min < 0 && max > 0 ? 0 : null,
  };
};

const hasSymmetricValues = (data: (number | null)[][]) => {
  const tolerance = 1e-6;
  for (let row = 0; row < data.length; row += 1) {
    for (let column = row + 1; column < data.length; column += 1) {
      const left = data[row][column];
      const right = data[column][row];
      if (left === null || right === null) continue;
      if (Math.abs(left - right) > tolerance) return false;
    }
  }
  return true;
};

const addInferredField = (
  inference: NormalizedImportInference,
  source: string,
  field: string,
  value: string,
) => {
  inference.inferredFields.push({ source, field, value });
};

export const normalizeMatrices = ({
  matrixFiles,
  fallbacks,
  errors,
  warnings,
  inference,
  strict,
}: NormalizeMatricesArgs): NormalizedMatrix[] => {
  const usedIds = new Set<string>();

  return matrixFiles.flatMap((file, index) => {
    const source = file.source;
    const mode = strict ? "strict" : "lenient";
    const record = parseMatrixImportRecord(file.payload, mode, source, errors);

    if (!record) {
      return [];
    }

    const layout = getMatrixLayout(record);
    const symmetric = fallbacks.symmetric;
    const data = normalizeMatrixData(record.data, layout, symmetric, source, errors);
    if (!data) return [];
    if ("rois" in record) {
      warnings.push({
        source,
        path: `${source}.rois`,
        message: "Matrix-level rois is ignored; define ROI metadata in rois.json.",
      });
    }

    const label = getOptionalString(record, ["label", "name"]);
    const idSource = getOptionalString(record, ["id"]) ?? label;
    const generatedId = `matrix-${String(index + 1).padStart(3, "0")}`;
    const id = toSlug(idSource ?? generatedId, generatedId);

    if (!idSource) {
      inference.generatedMatrixIds.push(id);
      addInferredField(inference, source, "id", id);
      if (strict) {
        errors.push({
          source,
          path: `${source}.id`,
          message: "Strict import requires each matrix to define id or label.",
        });
      }
    }
    if (usedIds.has(id)) {
      errors.push({ source, path: `${source}.id`, message: `Duplicate matrix id '${id}'.` });
    }
    usedIds.add(id);

    const inferredLayerId = `layer-${index + 1}`;
    const layerId = getOptionalString(record, ["layer", "layerId"]) ?? inferredLayerId;
    const measureId = getOptionalString(record, ["measure", "measureId"]) ??
      UNKNOWN_IMPORT_METADATA;
    const statId = getOptionalString(record, ["stat", "statId"]) ??
      UNKNOWN_IMPORT_METADATA;
    const populationIds = getPopulationIds(record, UNKNOWN_IMPORT_METADATA);
    const kind = getMatrixKind(record);
    const subjectId = kind === "subject" ? getSubjectId(record, id) : undefined;

    if (!getOptionalString(record, ["layer", "layerId"])) {
      addInferredField(inference, source, "layer", layerId);
    }
    if (!getOptionalString(record, ["measure", "measureId"])) {
      addInferredField(inference, source, "measure", measureId);
    }
    if (!getOptionalString(record, ["stat", "statId"])) {
      addInferredField(inference, source, "stat", statId);
    }
    if (!getOptionalString(record, ["population", "populationId"]) && !Array.isArray(record.populationIds)) {
      addInferredField(inference, source, "population", populationIds.join("+"));
    }
    if (strict) {
      for (const field of ["layer", "measure", "stat", "population"] as const) {
        const keys = field === "population" ? ["population", "populationId"] : [field, `${field}Id`];
        if (!getOptionalString(record, keys) && !(field === "population" && Array.isArray(record.populationIds))) {
          errors.push({
            source,
            path: `${source}.${field}`,
            message: `Strict import requires matrix.${field}.`,
          });
        }
      }
    } else if (
      symmetric &&
      layout === "full" &&
      !hasSymmetricValues(data)
    ) {
      warnings.push({
        source,
        path: `${source}.data`,
        message: "Matrix is declared symmetric but contains asymmetric values.",
      });
    }

    return [{
      id,
      label: label ?? id,
      kind,
      layout,
      layerId: toSlug(layerId, "default"),
      measureId: toSlug(measureId, "connectivity"),
      statId: toSlug(statId, "value"),
      populationIds: populationIds.map((value) => toSlug(value, "dataset")),
      subjectId: subjectId ? toSlug(subjectId, id) : undefined,
      comparison: kind === "comparison" ? getComparison(record, populationIds) : undefined,
      n: typeof record.n === "number" && Number.isInteger(record.n) && record.n > 0
        ? record.n
        : undefined,
      data,
      symmetric,
      valueDomain: computeValueDomain(data),
      source,
    }];
  });
};
