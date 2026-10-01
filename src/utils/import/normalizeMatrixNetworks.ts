import type { MatrixLayout } from "@/types/network";
import { isNonEmptyString, toSlug } from "@/utils/import/guards";
import { parseMatrixImportRecord } from "@/utils/import/schemas/matrixSchema";
import type {
  ImportedNetworkDraft,
  NetworkImportInference,
  NetworkImportIssue,
  RawMatrixFile,
} from "@/utils/import/types";

type NormalizeMatrixNetworksArgs = {
  matrixFiles: RawMatrixFile[];
  errors: NetworkImportIssue[];
  warnings: NetworkImportIssue[];
  inference: NetworkImportInference;
};

const getOptionalString = (value: unknown) =>
  isNonEmptyString(value) ? value.trim() : null;

const getMatrixLayout = (record: Record<string, unknown>): MatrixLayout => {
  const raw = getOptionalString(record.layout);
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
  errors: NetworkImportIssue[],
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
  errors: NetworkImportIssue[],
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

const hasSymmetricValues = (data: (number | null)[][]) => {
  const tolerance = 1e-6;
  for (let row = 0; row < data.length; row += 1) {
    for (let column = row + 1; column < data.length; column += 1) {
      const left = data[row][column];
      const right = data[column][row];
      if (left === right) continue;
      if (left === null || right === null) return false;
      if (Math.abs(left - right) > tolerance) return false;
    }
  }
  return true;
};

const addInferredField = (
  inference: NetworkImportInference,
  source: string,
  field: string,
  value: string,
) => {
  inference.inferredFields.push({ source, field, value });
};

export const normalizeMatrixNetworks = ({
  matrixFiles,
  errors,
  warnings,
  inference,
}: NormalizeMatrixNetworksArgs): ImportedNetworkDraft[] => {
  const usedIds = new Set<string>();

  return matrixFiles.flatMap((file, index) => {
    const source = file.source;
    const record = parseMatrixImportRecord(file.payload, source, errors);

    if (!record) {
      return [];
    }

    const layout = getMatrixLayout(record);
    const data = normalizeMatrixData(record.data, layout, source, errors);
    if (!data) return [];
    if ("rois" in record) {
      warnings.push({
        source,
        path: `${source}.rois`,
        message: "Matrix-level rois is ignored; define Node metadata in rois.json.",
      });
    }

    const label = getOptionalString(record.label);
    const idSource = getOptionalString(record.id) ?? label;
    const generatedId = `network-${String(index + 1).padStart(3, "0")}`;
    const id = toSlug(idSource ?? generatedId, generatedId);

    if (!idSource) {
      inference.generatedNetworkIds.push(id);
      addInferredField(inference, source, "id", id);
      errors.push({
        source,
        path: `${source}.id`,
        message: "Each network must define id or label.",
      });
    }
    if (usedIds.has(id)) {
      errors.push({ source, path: `${source}.id`, message: `Duplicate network id '${id}'.` });
    }
    usedIds.add(id);

    if (layout === "full" && !hasSymmetricValues(data)) {
      errors.push({
        source,
        path: `${source}.data`,
        message: "Only undirected networks are supported; matrix values must be symmetric.",
      });
      return [];
    }

    return [{
      id,
      label: label ?? id,
      layout,
      sourceId: record.source.trim(),
      measureId: record.measure.trim(),
      statisticId: record.statistic.trim(),
      dimensions: Object.fromEntries(
        Object.entries(record.dimensions).map(([key, value]) => [
          key.trim(),
          value.trim(),
        ]),
      ),
      data,
      valueDomain: computeValueDomain(data),
      source,
    }];
  });
};
