import type { MatrixRecord } from "@/types/connectivityBundle";
import { getMatrixCalculationMethodDefinitions } from "@/connectivity/calculations/methods";
import type {
  CalculationInputRole,
  MatrixCalculationBatchRequest,
  MatrixCalculationOperation,
  MatrixCalculationState,
  ResolvedCalculationInputs,
} from "@/connectivity/calculations/types";

const sameContext = (
  matrix: MatrixRecord,
  request: MatrixCalculationBatchRequest,
  bandId: string,
  measureId: string,
) =>
  matrix.context.bandId === bandId &&
  matrix.context.measureId === measureId &&
  (request.conditionId === undefined || matrix.context.conditionId === request.conditionId) &&
  (request.sessionId === undefined || matrix.context.sessionId === request.sessionId) &&
  (request.taskId === undefined || matrix.context.taskId === request.taskId);

const hasPopulation = (matrix: MatrixRecord, populationId?: string) =>
  Boolean(
    populationId &&
      "populationIds" in matrix.source &&
      matrix.source.populationIds.includes(populationId),
  );

const hasSubject = (matrix: MatrixRecord, subjectId?: string) =>
  Boolean(subjectId && matrix.source.level === "subject" && matrix.source.subjectId === subjectId);

const roleCriteria = (
  role: CalculationInputRole,
  request: MatrixCalculationBatchRequest,
  subjectId?: string,
) => {
  switch (role) {
    case "subjectValue":
      return { kind: "subject" as const, statId: "value", subjectId };
    case "targetMean":
      return { kind: "aggregate" as const, statId: "mean", populationId: request.leftPopulationId };
    case "referenceMean":
      return { kind: "aggregate" as const, statId: "mean", populationId: request.referencePopulationId ?? request.rightPopulationId };
    case "referenceStd":
      return { kind: "aggregate" as const, statId: "std", populationId: request.referencePopulationId ?? request.rightPopulationId };
    case "leftMean":
      return { kind: "aggregate" as const, statId: "mean", populationId: request.leftPopulationId };
    case "rightMean":
      return { kind: "aggregate" as const, statId: "mean", populationId: request.rightPopulationId };
    case "leftStd":
      return { kind: "aggregate" as const, statId: "std", populationId: request.leftPopulationId };
    case "rightStd":
      return { kind: "aggregate" as const, statId: "std", populationId: request.rightPopulationId };
  }
};

const findRoleMatrix = (
  role: CalculationInputRole,
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
  bandId: string,
  measureId: string,
  subjectId?: string,
) => {
  const criteria = roleCriteria(role, request, subjectId);
  const candidates = state.matrices.filter((matrix) => {
    if (matrix.kind !== criteria.kind) return false;
    if (matrix.stat.id !== criteria.statId) return false;
    if (!sameContext(matrix, request, bandId, measureId)) return false;
    if ("subjectId" in criteria) return hasSubject(matrix, criteria.subjectId);
    return hasPopulation(matrix, criteria.populationId);
  });

  return {
    matrix: candidates[0],
    ambiguous: candidates.length > 1,
  };
};

const requiredRolesForOperation = (
  operation: MatrixCalculationOperation,
): CalculationInputRole[] => {
  if (operation === "subject_zscore_vs_population") {
    return ["subjectValue", "referenceMean", "referenceStd"];
  }
  if (operation === "population_reference_zscore") {
    return ["targetMean", "referenceMean", "referenceStd"];
  }
  if (operation === "population_difference") return ["leftMean", "rightMean"];
  return ["leftMean", "rightMean", "leftStd", "rightStd"];
};

export const resolveCalculationInputsForBandMeasure = (
  request: MatrixCalculationBatchRequest & { operation?: MatrixCalculationOperation },
  state: MatrixCalculationState,
  bandId: string,
  measureId: string,
  subjectId?: string,
): ResolvedCalculationInputs => {
  const operation = request.operation ?? request.operations[0];
  const roles = requiredRolesForOperation(operation);
  const matrices: ResolvedCalculationInputs["matrices"] = {};
  const warnings: string[] = [];
  const missingRoles: CalculationInputRole[] = [];

  roles.forEach((role) => {
    const { matrix, ambiguous } = findRoleMatrix(
      role,
      request,
      state,
      bandId,
      measureId,
      subjectId,
    );
    if (!matrix) {
      missingRoles.push(role);
      return;
    }
    matrices[role] = matrix;
    if (ambiguous) {
      warnings.push(`Multiple candidate matrices found for ${role}. The first candidate was used.`);
    }
  });

  return { matrices, warnings, missingRoles };
};

export const assertContextCompatible = (matrices: MatrixRecord[]) => {
  if (matrices.length <= 1) return;
  const [first] = matrices;
  const incompatible = matrices.find(
    (matrix) =>
      matrix.context.bandId !== first.context.bandId ||
      matrix.context.measureId !== first.context.measureId ||
      matrix.geometry.atlasId !== first.geometry.atlasId ||
      matrix.geometry.shape[0] !== first.geometry.shape[0] ||
      matrix.geometry.shape[1] !== first.geometry.shape[1],
  );
  if (incompatible) {
    throw new Error(`Matrix '${incompatible.id}' is not compatible with '${first.id}'.`);
  }
};

export const validateMatrixCalculationRequest = (
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
) => {
  const errors: string[] = [];
  if (!request.operations.length) errors.push("Select at least one calculation method.");
  if (!request.bandIds.length) errors.push("Select at least one band.");
  if (!request.measureIds.length) errors.push("Select at least one measure.");
  request.operations.forEach((operation) => {
    if (!getMatrixCalculationMethodDefinitions().some((method) => method.id === operation)) {
      errors.push(`Unknown calculation operation '${operation}'.`);
    }
    if (operation === "subject_zscore_vs_population" && !request.subjectIds?.length) {
      errors.push("Select at least one subject.");
    }
    if (operation !== "subject_zscore_vs_population" && !request.leftPopulationId) {
      errors.push("Select a left/target population.");
    }
    if (
      operation !== "subject_zscore_vs_population" &&
      operation !== "population_reference_zscore" &&
      !request.rightPopulationId
    ) {
      errors.push("Select a right/control population.");
    }
    if (operation === "population_reference_zscore" && !request.referencePopulationId) {
      errors.push("Select a reference population.");
    }
  });
  if (!state.matrices.length) errors.push("No matrices are loaded.");
  return { valid: errors.length === 0, errors };
};

export const getAvailableMatrixCalculations = (state: MatrixCalculationState) => {
  const hasSubjectValue = state.matrices.some(
    (matrix) => matrix.kind === "subject" && matrix.stat.id === "value",
  );
  const populationMeanIds = new Set(
    state.matrices
      .filter((matrix) => matrix.kind === "aggregate" && matrix.stat.id === "mean")
      .flatMap((matrix) => ("populationIds" in matrix.source ? matrix.source.populationIds : [])),
  );
  const populationStdIds = new Set(
    state.matrices
      .filter((matrix) => matrix.kind === "aggregate" && matrix.stat.id === "std")
      .flatMap((matrix) => ("populationIds" in matrix.source ? matrix.source.populationIds : [])),
  );
  const populationWithMeanAndStd = [...populationMeanIds].filter((id) =>
    populationStdIds.has(id),
  );
  const subjectScope = hasSubjectValue && populationWithMeanAndStd.length > 0;
  const populationScope = populationMeanIds.size >= 2;
  return getMatrixCalculationMethodDefinitions().filter((method) => {
    if (method.scope === "subject_vs_population") return subjectScope;
    if (method.id === "population_difference") return populationScope;
    return populationWithMeanAndStd.length >= 2;
  });
};

export const findEquivalentDerivedMatrix = (
  candidate: Pick<MatrixRecord, "kind" | "stat" | "context" | "comparison">,
  matrixIndex: Record<string, MatrixRecord>,
) =>
  Object.values(matrixIndex).find((matrix) => {
    if (matrix.kind !== candidate.kind) return false;
    if (matrix.stat.id !== candidate.stat.id || matrix.stat.method !== candidate.stat.method) {
      return false;
    }
    if (matrix.context.bandId !== candidate.context.bandId) return false;
    if (matrix.context.measureId !== candidate.context.measureId) return false;
    if (matrix.comparison?.operator !== candidate.comparison?.operator) return false;
    if (matrix.comparison?.comparisonType !== candidate.comparison?.comparisonType) return false;
    if (matrix.comparison?.leftMatrixId !== candidate.comparison?.leftMatrixId) return false;
    if (matrix.comparison?.rightMatrixId !== candidate.comparison?.rightMatrixId) return false;
    return JSON.stringify(matrix.comparison?.parameters ?? {}) ===
      JSON.stringify(candidate.comparison?.parameters ?? {});
  });
