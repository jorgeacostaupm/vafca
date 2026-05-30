import type {
  ConnectivityImportIssue,
  NormalizedImportInference,
  NormalizedMatrix,
  RawZipMatrixFile,
} from "@/utils/import/types";
import type { MatrixLayout } from "@/types/connectivityBundle";
import { isNonEmptyString, isRecord, toSlug } from "@/utils/import/guards";

type MatrixDefaults = {
  layer: string;
  measure: string;
  stat: string;
  population: string;
};

type NormalizeMatricesArgs = {
  matrixFiles: RawZipMatrixFile[];
  defaults: MatrixDefaults;
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

const getMatrixKind = (record: Record<string, unknown>) =>
  record.kind === "comparison" || isRecord(record.comparison)
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
        data[column][row] = value;
        valueIndex += 1;
      }
    }
    return data;
  }

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      const value = values[valueIndex];
      data[row][column] = value;
      data[column][row] = value;
      valueIndex += 1;
    }
  }
  return data;
};

const normalizeMatrixData = (
  data: unknown,
  layout: MatrixLayout,
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
    return materializeTriangularData(values, size, layout);
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

const isSymmetric = (data: (number | null)[][]) => {
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

const addDefaultedField = (
  inference: NormalizedImportInference,
  source: string,
  field: string,
  value: string,
) => {
  inference.defaultedFields.push({ source, field, value });
};

export const normalizeMatrices = ({
  matrixFiles,
  defaults,
  errors,
  warnings,
  inference,
  strict,
}: NormalizeMatricesArgs): NormalizedMatrix[] => {
  const usedIds = new Set<string>();

  return matrixFiles.flatMap((file, index) => {
    const source = file.source;
    const payload = file.payload;
    const record = Array.isArray(payload)
      ? { data: payload }
      : isRecord(payload)
        ? payload
        : null;

    if (!record) {
      errors.push({
        source,
        path: source,
        message: "Matrix file must contain a matrix object or a raw matrix array.",
      });
      return [];
    }

    const layout = getMatrixLayout(record);
    const data = normalizeMatrixData(record.data, layout, source, errors);
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
      addDefaultedField(inference, source, "id", id);
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

    const layerId = getOptionalString(record, ["layer", "layerId"]) ?? defaults.layer;
    const measureId = getOptionalString(record, ["measure", "measureId"]) ?? defaults.measure;
    const statId = getOptionalString(record, ["stat", "statId"]) ?? defaults.stat;
    const populationIds = getPopulationIds(record, defaults.population);
    const kind = getMatrixKind(record);

    if (!getOptionalString(record, ["layer", "layerId"])) {
      addDefaultedField(inference, source, "layer", layerId);
    }
    if (!getOptionalString(record, ["measure", "measureId"])) {
      addDefaultedField(inference, source, "measure", measureId);
    }
    if (!getOptionalString(record, ["stat", "statId"])) {
      addDefaultedField(inference, source, "stat", statId);
    }
    if (!getOptionalString(record, ["population", "populationId"]) && !Array.isArray(record.populationIds)) {
      addDefaultedField(inference, source, "population", populationIds.join("+"));
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
    } else if (!isSymmetric(data)) {
      warnings.push({
        source,
        path: `${source}.data`,
        message: "Matrix is not symmetric.",
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
      comparison: kind === "comparison" ? getComparison(record, populationIds) : undefined,
      n: typeof record.n === "number" && Number.isInteger(record.n) && record.n > 0
        ? record.n
        : undefined,
      data,
      symmetric: isSymmetric(data),
      valueDomain: computeValueDomain(data),
      source,
    }];
  });
};
