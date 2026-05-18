import type {
  MatrixCellValue,
  MatrixComparison,
  MatrixRecord,
  MatrixSource,
} from "@/types/connectivityBundle";
import { getMatrixCalculationMethodDefinition } from "@/connectivity/calculations/methods";
import {
  EPSILON,
  type MatrixCalculationBatchRequest,
  type MatrixCalculationOperation,
  type MatrixCalculationResult,
  type MatrixCalculationSkipped,
  type MatrixCalculationState,
} from "@/connectivity/calculations/types";
import {
  assertContextCompatible,
  findEquivalentDerivedMatrix,
  resolveCalculationInputsForBandMeasure,
  validateMatrixCalculationRequest,
} from "@/connectivity/calculations/resolution";
import {
  buildProvenanceParameters,
  createDerivedMatrixRecord,
  generateDerivedMatrixId,
  generateDerivedMatrixLabel,
  outputValueDomain,
  populationLabel,
  subjectLabel,
} from "@/connectivity/calculations/records";
import {
  computePooledStd,
  computeWelchDf,
  createFullMatrixData,
  divideOrNull,
  getFiniteMatrixValueOrNull,
} from "@/connectivity/calculations/matrixMath";
import {
  twoSidedNormalPValue,
  twoSidedStudentTPValue,
} from "@/connectivity/calculations/statistics";

const alternative = "two-sided";

const getPopulationNFromMatrixOrCatalog = (
  matrix: MatrixRecord | undefined,
  state: MatrixCalculationState,
  populationId?: string,
) => {
  if (matrix?.source.level === "population" && Number.isFinite(matrix.source.n)) {
    return matrix.source.n;
  }
  return populationId ? state.catalogs.populations[populationId]?.n ?? null : null;
};

const getOutput = (operation: MatrixCalculationOperation, operator?: string) => {
  const definition = getMatrixCalculationMethodDefinition(operation);
  return operator
    ? [
        ...definition.outputs,
        ...(definition.associatedOutputs?.flatMap((item) => item.outputs) ?? []),
      ].find((output) => output.operator === operator) ?? definition.outputs[0]
    : definition.outputs[0];
};

const buildComparisonSource = (
  state: MatrixCalculationState,
  params: {
    leftPopulationId?: string;
    rightPopulationId?: string;
    referencePopulationId?: string;
    subjectId?: string;
    nLeft?: number | null;
    nRight?: number | null;
  },
): MatrixSource => ({
  level: "comparison",
  left: params.subjectId
    ? {
        level: "subject",
        subjectId: params.subjectId,
        label: subjectLabel(state.catalogs, params.subjectId),
      }
    : {
        level: "population",
        populationIds: params.leftPopulationId ? [params.leftPopulationId] : [],
        label: populationLabel(state.catalogs, params.leftPopulationId),
        n: params.nLeft ?? undefined,
      },
  right: {
    level: "population",
    populationIds: params.referencePopulationId
      ? [params.referencePopulationId]
      : params.rightPopulationId
        ? [params.rightPopulationId]
        : [],
    label: populationLabel(state.catalogs, params.referencePopulationId ?? params.rightPopulationId),
    n: params.nRight ?? undefined,
  },
});

const buildRecord = (params: {
  state: MatrixCalculationState;
  request: MatrixCalculationBatchRequest;
  operation: MatrixCalculationOperation;
  sourceMatrix: MatrixRecord;
  leftMatrixId?: string;
  rightMatrixId?: string;
  dependencies: string[];
  data: MatrixCellValue[][];
  operator: string;
  statMethod: string;
  formula: string;
  labelSuffix: string;
  leftPopulationId?: string;
  rightPopulationId?: string;
  referencePopulationId?: string;
  subjectId?: string;
  nLeft?: number | null;
  nRight?: number | null;
  statParameters?: Record<string, unknown>;
  comparisonParameters?: Record<string, unknown>;
  provenanceExtra?: Record<string, unknown>;
  existingIds: Set<string>;
}) => {
  const output = getOutput(params.operation, params.operator);
  const id = generateDerivedMatrixId({
    prefix: params.request.outputIdPrefix,
    leftId: params.leftPopulationId,
    rightId: params.referencePopulationId ?? params.rightPopulationId,
    subjectId: params.subjectId,
    bandId: params.sourceMatrix.context.bandId,
    measureId: params.sourceMatrix.context.measureId,
    operator: params.operator,
    existingIds: params.existingIds,
  });
  params.existingIds.add(id);
  const comparison: MatrixComparison = {
    operator: params.operator,
    comparisonType: output.comparisonType,
    formula: params.formula,
    leftMatrixId: params.leftMatrixId,
    rightMatrixId: params.rightMatrixId,
    parameters: {
      methodId: params.operation,
      leftPopulationId: params.leftPopulationId,
      rightPopulationId: params.rightPopulationId,
      referencePopulationId: params.referencePopulationId,
      subjectId: params.subjectId,
      nLeft: params.nLeft,
      nRight: params.nRight,
      alternative: params.operator.includes("p") ? alternative : undefined,
      ...params.comparisonParameters,
    },
  };

  return createDerivedMatrixRecord({
    id,
    label: generateDerivedMatrixLabel({
      catalogs: params.state.catalogs,
      leftPopulationId: params.leftPopulationId,
      rightPopulationId: params.rightPopulationId,
      referencePopulationId: params.referencePopulationId,
      subjectId: params.subjectId,
      bandId: params.sourceMatrix.context.bandId,
      measureId: params.sourceMatrix.context.measureId,
      suffix: params.labelSuffix,
      useMinus: params.operation === "population_difference",
    }),
    context: params.sourceMatrix.context,
    geometry: params.sourceMatrix.geometry,
    symmetric: params.sourceMatrix.encoding.symmetric,
    source: buildComparisonSource(params.state, params),
    stat: {
      id: output.statId,
      method: params.statMethod,
      parameters: params.statParameters ?? {},
    },
    comparison,
    valueDomain: outputValueDomain(output),
    dependencies: params.dependencies,
    provenanceParameters: buildProvenanceParameters({
      operation: params.operation,
      bandId: params.sourceMatrix.context.bandId,
      measureId: params.sourceMatrix.context.measureId,
      leftPopulationId: params.leftPopulationId,
      rightPopulationId: params.rightPopulationId,
      referencePopulationId: params.referencePopulationId,
      subjectId: params.subjectId,
      formula: params.formula,
      methodId: params.operation,
      extra: params.provenanceExtra,
    }),
    data: params.data,
  });
};

const ensureReady = (
  operation: MatrixCalculationOperation,
  bandId: string,
  measureId: string,
  skipped: MatrixCalculationSkipped[],
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
  subjectId?: string,
) => {
  const resolved = resolveCalculationInputsForBandMeasure(
    { ...request, operation },
    state,
    bandId,
    measureId,
    subjectId,
  );
  if (resolved.missingRoles.length) {
    skipped.push({
      operation,
      bandId,
      measureId,
      subjectId,
      leftPopulationId: request.leftPopulationId,
      rightPopulationId: request.rightPopulationId,
      referencePopulationId: request.referencePopulationId,
      reason: `Missing inputs: ${resolved.missingRoles.join(", ")}`,
      missingInputs: resolved.missingRoles,
    });
    return null;
  }
  try {
    assertContextCompatible(Object.values(resolved.matrices).filter(Boolean) as MatrixRecord[]);
  } catch (error) {
    skipped.push({
      operation,
      bandId,
      measureId,
      subjectId,
      leftPopulationId: request.leftPopulationId,
      rightPopulationId: request.rightPopulationId,
      referencePopulationId: request.referencePopulationId,
      reason: error instanceof Error ? error.message : "Context is incompatible.",
    });
    return null;
  }
  return resolved;
};

const createBinaryData = (
  source: MatrixRecord,
  callback: (i: number, j: number) => MatrixCellValue,
) => createFullMatrixData(source.geometry.shape, callback);

const maybePush = (
  matrix: MatrixRecord,
  state: MatrixCalculationState,
  result: MatrixCalculationResult,
) => {
  const existing = findEquivalentDerivedMatrix(matrix, state.matrixIndex);
  if (existing) {
    result.existing.push(existing);
    return;
  }
  result.matrices.push(matrix);
};

const calculateSubjectZScoreVsPopulation = (
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
  result: MatrixCalculationResult,
  existingIds: Set<string>,
) => {
  request.subjectIds?.forEach((subjectId) => {
    request.bandIds.forEach((bandId) => {
      request.measureIds.forEach((measureId) => {
        const resolved = ensureReady(
          "subject_zscore_vs_population",
          bandId,
          measureId,
          result.skipped,
          request,
          state,
          subjectId,
        );
        if (!resolved) return;
        result.warnings.push(...resolved.warnings);
        const subjectValue = resolved.matrices.subjectValue!;
        const referenceMean = resolved.matrices.referenceMean!;
        const referenceStd = resolved.matrices.referenceStd!;
        const data = createBinaryData(subjectValue, (i, j) => {
          const value = getFiniteMatrixValueOrNull(subjectValue, i, j);
          const mean = getFiniteMatrixValueOrNull(referenceMean, i, j);
          const std = getFiniteMatrixValueOrNull(referenceStd, i, j);
          if (value === null || mean === null || std === null) return null;
          return divideOrNull(value - mean, std);
        });
        maybePush(
          buildRecord({
            state,
            request,
            operation: "subject_zscore_vs_population",
            sourceMatrix: subjectValue,
            leftMatrixId: subjectValue.id,
            rightMatrixId: referenceMean.id,
            dependencies: [subjectValue.id, referenceMean.id, referenceStd.id],
            data,
            operator: "zscore",
            statMethod: "subject_vs_population",
            formula: "(subject - reference_population_mean) / reference_population_std",
            labelSuffix: "z-score",
            referencePopulationId: request.referencePopulationId,
            subjectId,
            statParameters: { epsilon: EPSILON },
            comparisonParameters: {
              subjectValueMatrixId: subjectValue.id,
              referenceMeanMatrixId: referenceMean.id,
              referenceStdMatrixId: referenceStd.id,
              epsilon: EPSILON,
            },
            provenanceExtra: { epsilon: EPSILON },
            existingIds,
          }),
          state,
          result,
        );
      });
    });
  });
};

const calculatePopulationReferenceZScore = (
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
  result: MatrixCalculationResult,
  existingIds: Set<string>,
) => {
  request.bandIds.forEach((bandId) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_reference_zscore",
        bandId,
        measureId,
        result.skipped,
        request,
        state,
      );
      if (!resolved) return;
      result.warnings.push(...resolved.warnings);
      const targetMean = resolved.matrices.targetMean!;
      const referenceMean = resolved.matrices.referenceMean!;
      const referenceStd = resolved.matrices.referenceStd!;
      const data = createBinaryData(targetMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(targetMean, i, j);
        const right = getFiniteMatrixValueOrNull(referenceMean, i, j);
        const std = getFiniteMatrixValueOrNull(referenceStd, i, j);
        if (left === null || right === null || std === null) return null;
        return divideOrNull(left - right, std);
      });
      maybePush(
        buildRecord({
          state,
          request,
          operation: "population_reference_zscore",
          sourceMatrix: targetMean,
          leftMatrixId: targetMean.id,
          rightMatrixId: referenceMean.id,
          dependencies: [targetMean.id, referenceMean.id, referenceStd.id],
          data,
          operator: "reference_zscore",
          statMethod: "population_reference",
          formula: "(target_mean - reference_mean) / reference_std",
          labelSuffix: "reference z-score",
          leftPopulationId: request.leftPopulationId,
          referencePopulationId: request.referencePopulationId,
          statParameters: { epsilon: EPSILON },
          comparisonParameters: {
            referenceStdMatrixId: referenceStd.id,
            epsilon: EPSILON,
          },
          provenanceExtra: { epsilon: EPSILON },
          existingIds,
        }),
        state,
        result,
      );
    });
  });
};

const calculatePopulationDifference = (
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
  result: MatrixCalculationResult,
  existingIds: Set<string>,
) => {
  request.bandIds.forEach((bandId) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_difference",
        bandId,
        measureId,
        result.skipped,
        request,
        state,
      );
      if (!resolved) return;
      result.warnings.push(...resolved.warnings);
      const leftMean = resolved.matrices.leftMean!;
      const rightMean = resolved.matrices.rightMean!;
      const data = createBinaryData(leftMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(leftMean, i, j);
        const right = getFiniteMatrixValueOrNull(rightMean, i, j);
        return left === null || right === null ? null : left - right;
      });
      maybePush(
        buildRecord({
          state,
          request,
          operation: "population_difference",
          sourceMatrix: leftMean,
          leftMatrixId: leftMean.id,
          rightMatrixId: rightMean.id,
          dependencies: [leftMean.id, rightMean.id],
          data,
          operator: "difference",
          statMethod: "left_minus_right",
          formula: "left_mean - right_mean",
          labelSuffix: "difference",
          leftPopulationId: request.leftPopulationId,
          rightPopulationId: request.rightPopulationId,
          comparisonParameters: {
            leftMeanMatrixId: leftMean.id,
            rightMeanMatrixId: rightMean.id,
          },
          existingIds,
        }),
        state,
        result,
      );
    });
  });
};

const getNOrSkip = (
  operation: MatrixCalculationOperation,
  bandId: string,
  measureId: string,
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
  leftMean: MatrixRecord,
  rightMean: MatrixRecord,
  skipped: MatrixCalculationSkipped[],
) => {
  const nLeft = getPopulationNFromMatrixOrCatalog(leftMean, state, request.leftPopulationId);
  const nRight = getPopulationNFromMatrixOrCatalog(rightMean, state, request.rightPopulationId);
  if (!nLeft || !nRight || nLeft <= 1 || nRight <= 1) {
    skipped.push({
      operation,
      bandId,
      measureId,
      leftPopulationId: request.leftPopulationId,
      rightPopulationId: request.rightPopulationId,
      reason: "n_left and n_right must both be greater than 1.",
    });
    return null;
  }
  return { nLeft, nRight };
};

const calculateStudentTFromCohensD = (
  cohensDData: MatrixCellValue[][],
  params: { nLeft: number; nRight: number },
) => {
  const denominator = Math.sqrt(1 / params.nLeft + 1 / params.nRight);
  return cohensDData.map((row) =>
    row.map((value) =>
      typeof value === "number" && Number.isFinite(value)
        ? divideOrNull(value, denominator)
        : null,
    ),
  );
};

const calculateStudentPValueFromCohensD = (
  tData: MatrixCellValue[][],
  params: { df: number },
) =>
  tData.map((row) =>
    row.map((value) =>
      typeof value === "number" && Number.isFinite(value)
        ? twoSidedStudentTPValue(value, params.df)
        : null,
    ),
  );

const calculatePopulationTwoSampleZPValue = (zData: MatrixCellValue[][]) =>
  zData.map((row) =>
    row.map((value) =>
      typeof value === "number" && Number.isFinite(value)
        ? twoSidedNormalPValue(value)
        : null,
    ),
  );

const calculatePopulationWelchPValue = (
  tData: MatrixCellValue[][],
  dfData: MatrixCellValue[][],
) =>
  tData.map((row, i) =>
    row.map((value, j) => {
      const df = dfData[i][j];
      return typeof value === "number" &&
        Number.isFinite(value) &&
        typeof df === "number" &&
        Number.isFinite(df) &&
        df > 0
        ? twoSidedStudentTPValue(value, df)
        : null;
    }),
  );

const calculatePopulationCohensD = (
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
  result: MatrixCalculationResult,
  existingIds: Set<string>,
) => {
  request.bandIds.forEach((bandId) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_cohens_d",
        bandId,
        measureId,
        result.skipped,
        request,
        state,
      );
      if (!resolved) return;
      result.warnings.push(...resolved.warnings);
      const leftMean = resolved.matrices.leftMean!;
      const rightMean = resolved.matrices.rightMean!;
      const n = getNOrSkip(
        "population_cohens_d",
        bandId,
        measureId,
        request,
        state,
        leftMean,
        rightMean,
        result.skipped,
      );
      if (!n) return;
      const leftStd = resolved.matrices.leftStd!;
      const rightStd = resolved.matrices.rightStd!;
      const data = createBinaryData(leftMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(leftMean, i, j);
        const right = getFiniteMatrixValueOrNull(rightMean, i, j);
        const stdLeft = getFiniteMatrixValueOrNull(leftStd, i, j);
        const stdRight = getFiniteMatrixValueOrNull(rightStd, i, j);
        if (left === null || right === null || stdLeft === null || stdRight === null) return null;
        const pooled = computePooledStd(stdLeft, stdRight, n.nLeft, n.nRight);
        return pooled === null ? null : divideOrNull(left - right, pooled);
      });
      const dependencies = [leftMean.id, rightMean.id, leftStd.id, rightStd.id];
      maybePush(
        buildRecord({
          state,
          request,
          operation: "population_cohens_d",
          sourceMatrix: leftMean,
          leftMatrixId: leftMean.id,
          rightMatrixId: rightMean.id,
          dependencies,
          data,
          operator: "cohens_d",
          statMethod: "pooled_standard_deviation",
          formula: "(left_mean - right_mean) / pooled_std",
          labelSuffix: "Cohen's d",
          leftPopulationId: request.leftPopulationId,
          rightPopulationId: request.rightPopulationId,
          nLeft: n.nLeft,
          nRight: n.nRight,
          statParameters: { epsilon: EPSILON },
          comparisonParameters: {
            leftMeanMatrixId: leftMean.id,
            rightMeanMatrixId: rightMean.id,
            leftStdMatrixId: leftStd.id,
            rightStdMatrixId: rightStd.id,
            epsilon: EPSILON,
          },
          provenanceExtra: { epsilon: EPSILON, nLeft: n.nLeft, nRight: n.nRight, alternative },
          existingIds,
        }),
        state,
        result,
      );
      const selected = request.selectedAssociatedOutputs?.population_cohens_d ?? [];
      const needsT =
        selected.includes("student_t_from_cohens_d") ||
        selected.includes("student_p_value_from_cohens_d");
      const tData = needsT ? calculateStudentTFromCohensD(data, n) : null;
      const df = n.nLeft + n.nRight - 2;
      if (tData && selected.includes("student_t_from_cohens_d")) {
        maybePush(
          buildRecord({
            state,
            request,
            operation: "population_cohens_d",
            sourceMatrix: leftMean,
            leftMatrixId: leftMean.id,
            rightMatrixId: rightMean.id,
            dependencies,
            data: tData,
            operator: "student_t_from_cohens_d",
            statMethod: "student_from_cohens_d",
            formula: "d / sqrt(1/n_left + 1/n_right)",
            labelSuffix: "Student t",
            leftPopulationId: request.leftPopulationId,
            rightPopulationId: request.rightPopulationId,
            nLeft: n.nLeft,
            nRight: n.nRight,
            statParameters: { df },
            comparisonParameters: { df, epsilon: EPSILON },
            provenanceExtra: { df, nLeft: n.nLeft, nRight: n.nRight },
            existingIds,
          }),
          state,
          result,
        );
      }
      if (tData && selected.includes("student_p_value_from_cohens_d")) {
        const pData = calculateStudentPValueFromCohensD(tData, { df });
        maybePush(
          buildRecord({
            state,
            request,
            operation: "population_cohens_d",
            sourceMatrix: leftMean,
            leftMatrixId: leftMean.id,
            rightMatrixId: rightMean.id,
            dependencies,
            data: pData,
            operator: "student_p_from_cohens_d",
            statMethod: "student_from_cohens_d_two_sided",
            formula: "2 * (1 - studentTCdf(abs(t), df))",
            labelSuffix: "Student p-value",
            leftPopulationId: request.leftPopulationId,
            rightPopulationId: request.rightPopulationId,
            nLeft: n.nLeft,
            nRight: n.nRight,
            statParameters: { df, alternative },
            comparisonParameters: { df, alternative },
            provenanceExtra: { df, nLeft: n.nLeft, nRight: n.nRight, alternative },
            existingIds,
          }),
          state,
          result,
        );
      }
    });
  });
};

const calculatePopulationTwoSampleZTest = (
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
  result: MatrixCalculationResult,
  existingIds: Set<string>,
) => {
  request.bandIds.forEach((bandId) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_two_sample_z_test",
        bandId,
        measureId,
        result.skipped,
        request,
        state,
      );
      if (!resolved) return;
      result.warnings.push(...resolved.warnings);
      const leftMean = resolved.matrices.leftMean!;
      const rightMean = resolved.matrices.rightMean!;
      const n = getNOrSkip(
        "population_two_sample_z_test",
        bandId,
        measureId,
        request,
        state,
        leftMean,
        rightMean,
        result.skipped,
      );
      if (!n) return;
      const leftStd = resolved.matrices.leftStd!;
      const rightStd = resolved.matrices.rightStd!;
      const hypothesizedDifference = request.hypothesizedDifference ?? 0;
      const data = createBinaryData(leftMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(leftMean, i, j);
        const right = getFiniteMatrixValueOrNull(rightMean, i, j);
        const stdLeft = getFiniteMatrixValueOrNull(leftStd, i, j);
        const stdRight = getFiniteMatrixValueOrNull(rightStd, i, j);
        if (left === null || right === null || stdLeft === null || stdRight === null) return null;
        const se = Math.sqrt((stdLeft * stdLeft) / n.nLeft + (stdRight * stdRight) / n.nRight);
        return divideOrNull(left - right - hypothesizedDifference, se);
      });
      const dependencies = [leftMean.id, rightMean.id, leftStd.id, rightStd.id];
      maybePush(
        buildRecord({
          state,
          request,
          operation: "population_two_sample_z_test",
          sourceMatrix: leftMean,
          leftMatrixId: leftMean.id,
          rightMatrixId: rightMean.id,
          dependencies,
          data,
          operator: "two_sample_z_test",
          statMethod: "two_sample_z_test",
          formula: "((left_mean - right_mean) - hypothesized_difference) / standard_error",
          labelSuffix: "two-sample Z",
          leftPopulationId: request.leftPopulationId,
          rightPopulationId: request.rightPopulationId,
          nLeft: n.nLeft,
          nRight: n.nRight,
          statParameters: { hypothesizedDifference, epsilon: EPSILON },
          comparisonParameters: { hypothesizedDifference, epsilon: EPSILON },
          provenanceExtra: { hypothesizedDifference, epsilon: EPSILON, nLeft: n.nLeft, nRight: n.nRight, alternative },
          existingIds,
        }),
        state,
        result,
      );
      if (request.selectedAssociatedOutputs?.population_two_sample_z_test?.includes("two_sample_z_p_value")) {
        maybePush(
          buildRecord({
            state,
            request,
            operation: "population_two_sample_z_test",
            sourceMatrix: leftMean,
            leftMatrixId: leftMean.id,
            rightMatrixId: rightMean.id,
            dependencies,
            data: calculatePopulationTwoSampleZPValue(data),
            operator: "two_sample_z_p_value",
            statMethod: "two_sample_z_test_two_sided",
            formula: "2 * (1 - normalCdf(abs(z)))",
            labelSuffix: "Z-test p-value",
            leftPopulationId: request.leftPopulationId,
            rightPopulationId: request.rightPopulationId,
            nLeft: n.nLeft,
            nRight: n.nRight,
            statParameters: { hypothesizedDifference, alternative },
            comparisonParameters: { hypothesizedDifference, alternative },
            provenanceExtra: { hypothesizedDifference, nLeft: n.nLeft, nRight: n.nRight, alternative },
            existingIds,
          }),
          state,
          result,
        );
      }
    });
  });
};

const calculatePopulationWelchT = (
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
  result: MatrixCalculationResult,
  existingIds: Set<string>,
) => {
  request.bandIds.forEach((bandId) => {
    request.measureIds.forEach((measureId) => {
      const resolved = ensureReady(
        "population_welch_t",
        bandId,
        measureId,
        result.skipped,
        request,
        state,
      );
      if (!resolved) return;
      result.warnings.push(...resolved.warnings);
      const leftMean = resolved.matrices.leftMean!;
      const rightMean = resolved.matrices.rightMean!;
      const n = getNOrSkip(
        "population_welch_t",
        bandId,
        measureId,
        request,
        state,
        leftMean,
        rightMean,
        result.skipped,
      );
      if (!n) return;
      const leftStd = resolved.matrices.leftStd!;
      const rightStd = resolved.matrices.rightStd!;
      const dfData = createBinaryData(leftMean, (i, j) => {
        const stdLeft = getFiniteMatrixValueOrNull(leftStd, i, j);
        const stdRight = getFiniteMatrixValueOrNull(rightStd, i, j);
        if (stdLeft === null || stdRight === null) return null;
        return computeWelchDf(stdLeft, stdRight, n.nLeft, n.nRight);
      });
      const data = createBinaryData(leftMean, (i, j) => {
        const left = getFiniteMatrixValueOrNull(leftMean, i, j);
        const right = getFiniteMatrixValueOrNull(rightMean, i, j);
        const stdLeft = getFiniteMatrixValueOrNull(leftStd, i, j);
        const stdRight = getFiniteMatrixValueOrNull(rightStd, i, j);
        if (left === null || right === null || stdLeft === null || stdRight === null) return null;
        const se = Math.sqrt((stdLeft * stdLeft) / n.nLeft + (stdRight * stdRight) / n.nRight);
        return divideOrNull(left - right, se);
      });
      const dependencies = [leftMean.id, rightMean.id, leftStd.id, rightStd.id];
      maybePush(
        buildRecord({
          state,
          request,
          operation: "population_welch_t",
          sourceMatrix: leftMean,
          leftMatrixId: leftMean.id,
          rightMatrixId: rightMean.id,
          dependencies,
          data,
          operator: "welch_t",
          statMethod: "welch",
          formula: "(left_mean - right_mean) / standard_error",
          labelSuffix: "Welch t",
          leftPopulationId: request.leftPopulationId,
          rightPopulationId: request.rightPopulationId,
          nLeft: n.nLeft,
          nRight: n.nRight,
          statParameters: { epsilon: EPSILON },
          comparisonParameters: { epsilon: EPSILON },
          provenanceExtra: { epsilon: EPSILON, nLeft: n.nLeft, nRight: n.nRight, alternative },
          existingIds,
        }),
        state,
        result,
      );
      if (request.selectedAssociatedOutputs?.population_welch_t?.includes("welch_p_value")) {
        maybePush(
          buildRecord({
            state,
            request,
            operation: "population_welch_t",
            sourceMatrix: leftMean,
            leftMatrixId: leftMean.id,
            rightMatrixId: rightMean.id,
            dependencies,
            data: calculatePopulationWelchPValue(data, dfData),
            operator: "welch_p_value",
            statMethod: "welch_two_sided",
            formula: "2 * (1 - studentTCdf(abs(t), welch_df))",
            labelSuffix: "Welch p-value",
            leftPopulationId: request.leftPopulationId,
            rightPopulationId: request.rightPopulationId,
            nLeft: n.nLeft,
            nRight: n.nRight,
            statParameters: { epsilon: EPSILON, alternative },
            comparisonParameters: { epsilon: EPSILON, alternative },
            provenanceExtra: { epsilon: EPSILON, nLeft: n.nLeft, nRight: n.nRight, alternative },
            existingIds,
          }),
          state,
          result,
        );
      }
    });
  });
};

export const calculateDerivedMatrices = (
  request: MatrixCalculationBatchRequest,
  state: MatrixCalculationState,
): MatrixCalculationResult => {
  const validation = validateMatrixCalculationRequest(request, state);
  if (!validation.valid) {
    return {
      matrices: [],
      warnings: validation.errors,
      skipped: [],
      existing: [],
    };
  }

  const result: MatrixCalculationResult = {
    matrices: [],
    warnings: [],
    skipped: [],
    existing: [],
  };
  const existingIds = new Set(state.matrices.map((matrix) => matrix.id));
  request.operations.forEach((operation) => {
    if (operation === "subject_zscore_vs_population") {
      calculateSubjectZScoreVsPopulation(request, state, result, existingIds);
    } else if (operation === "population_reference_zscore") {
      calculatePopulationReferenceZScore(request, state, result, existingIds);
    } else if (operation === "population_difference") {
      calculatePopulationDifference(request, state, result, existingIds);
    } else if (operation === "population_cohens_d") {
      calculatePopulationCohensD(request, state, result, existingIds);
    } else if (operation === "population_two_sample_z_test") {
      calculatePopulationTwoSampleZTest(request, state, result, existingIds);
    } else if (operation === "population_welch_t") {
      calculatePopulationWelchT(request, state, result, existingIds);
    }
  });
  result.warnings = Array.from(new Set(result.warnings));
  return result;
};

export {
  calculatePopulationCohensD,
  calculatePopulationDifference,
  calculatePopulationReferenceZScore,
  calculatePopulationTwoSampleZPValue,
  calculatePopulationTwoSampleZTest,
  calculatePopulationWelchPValue,
  calculatePopulationWelchT,
  calculateStudentPValueFromCohensD,
  calculateStudentTFromCohensD,
  calculateSubjectZScoreVsPopulation,
};
