import type { ConnectivityCatalogs, ConnectivityMetadata } from "@/types/catalogs";
import type { ConnectivityMatrix } from "@/types/matrix";
import type { MatrixOrderItem } from "@/types/matrixOrder";

export type MatrixValidationError = {
  source: string;
  matrixId?: string;
  message: string;
};

export type MatrixValidationResult = {
  validMatrices: ConnectivityMatrix[];
  errors: MatrixValidationError[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const getMatrixCandidates = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;

  if (isRecord(payload)) {
    if (Array.isArray(payload.matrices)) return payload.matrices;
    if (isRecord(payload.matrix)) return [payload.matrix];
  }

  return null;
};

export const extractMatrixOrderFromPayload = (
  payload: unknown,
): MatrixOrderItem[] => {
  if (!isRecord(payload)) return [];

  if (Array.isArray(payload.matrixOrder)) {
    return payload.matrixOrder as MatrixOrderItem[];
  }

  if (isRecord(payload.metadata) && Array.isArray(payload.metadata.matrixOrder)) {
    return payload.metadata.matrixOrder as MatrixOrderItem[];
  }

  return [];
};

const validateMatrixData = (
  data: unknown,
  expectedSize: number | null,
): string | null => {
  if (!Array.isArray(data) || data.length === 0) {
    return "'data' must be a non-empty two-dimensional array.";
  }

  const rowCount = data.length;
  if (expectedSize !== null && rowCount !== expectedSize) {
    return `'data' must have ${expectedSize} rows to match metadata.matrixOrder.`;
  }

  for (const [rowIndex, row] of data.entries()) {
    if (!Array.isArray(row) || row.length !== rowCount) {
      return `Row ${rowIndex} must have ${rowCount} numeric values.`;
    }

    if (!row.every((value) => typeof value === "number" && Number.isFinite(value))) {
      return `Row ${rowIndex} contains a non-finite numeric value.`;
    }
  }

  return null;
};

const validateCatalogReferences = (
  matrix: Pick<
    ConnectivityMatrix,
    "bandId" | "measureId" | "populationIds" | "statId"
  >,
  catalogs: ConnectivityCatalogs,
) => {
  if (!catalogs.bands[matrix.bandId]) return `Unknown bandId '${matrix.bandId}'.`;
  if (!catalogs.measures[matrix.measureId]) {
    return `Unknown measureId '${matrix.measureId}'.`;
  }
  if (!catalogs.stats[matrix.statId]) return `Unknown statId '${matrix.statId}'.`;

  const unknownPopulationId = matrix.populationIds.find(
    (populationId) => !catalogs.populations[populationId],
  );
  if (unknownPopulationId) {
    return `Unknown populationId '${unknownPopulationId}'.`;
  }

  return null;
};

const validateMatrixCandidate = (
  candidate: unknown,
  source: string,
  catalogs: ConnectivityCatalogs,
  metadata: ConnectivityMetadata,
): { matrix: ConnectivityMatrix | null; error: MatrixValidationError | null } => {
  if (!isRecord(candidate)) {
    return {
      matrix: null,
      error: { source, message: "Matrix entry must be an object." },
    };
  }

  const matrixId = isNonEmptyString(candidate.id) ? candidate.id : undefined;
  const requiredFields = ["id", "bandId", "measureId", "statId"] as const;
  const missingField = requiredFields.find(
    (field) => !isNonEmptyString(candidate[field]),
  );

  if (missingField) {
    return {
      matrix: null,
      error: {
        source,
        matrixId,
        message: `'${missingField}' must be a non-empty string.`,
      },
    };
  }

  if (
    !Array.isArray(candidate.populationIds) ||
    candidate.populationIds.length === 0 ||
    !candidate.populationIds.every(isNonEmptyString)
  ) {
    return {
      matrix: null,
      error: {
        source,
        matrixId,
        message: "'populationIds' must be a non-empty string array.",
      },
    };
  }

  const id = candidate.id as string;
  const bandId = candidate.bandId as string;
  const measureId = candidate.measureId as string;
  const statId = candidate.statId as string;
  const populationIds = candidate.populationIds as string[];

  const dataError = validateMatrixData(
    candidate.data,
    metadata.matrixOrder.length > 0 ? metadata.matrixOrder.length : null,
  );
  if (dataError) {
    return {
      matrix: null,
      error: { source, matrixId, message: dataError },
    };
  }

  const matrix: ConnectivityMatrix = {
    id,
    bandId,
    measureId,
    statId,
    populationIds,
    data: candidate.data as number[][],
  };

  const catalogError = validateCatalogReferences(matrix, catalogs);
  if (catalogError) {
    return {
      matrix: null,
      error: { source, matrixId: matrix.id, message: catalogError },
    };
  }

  return { matrix, error: null };
};

export const validateMatrixPayload = (
  payload: unknown,
  source: string,
  catalogs: ConnectivityCatalogs,
  metadata: ConnectivityMetadata,
): MatrixValidationResult => {
  const candidates = getMatrixCandidates(payload);
  if (!candidates) {
    return {
      validMatrices: [],
      errors: [
        {
          source,
          message:
            "JSON must be a matrix object, an array of matrices, or an object with a 'matrices' array.",
        },
      ],
    };
  }

  return candidates.reduce<MatrixValidationResult>(
    (result, candidate) => {
      const validation = validateMatrixCandidate(
        candidate,
        source,
        catalogs,
        metadata,
      );
      if (validation.matrix) result.validMatrices.push(validation.matrix);
      if (validation.error) result.errors.push(validation.error);
      return result;
    },
    { validMatrices: [], errors: [] },
  );
};
