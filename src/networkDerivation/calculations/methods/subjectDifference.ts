import { createComparisonMatrix } from "@/networkDerivation/calculations/comparisonMatrixRecord";
import { getFiniteMatrixValueOrNull } from "@/networkDerivation/calculations/matrixMath";
import {
  createBinaryData,
  ensureReady,
  maybePush,
} from "@/networkDerivation/calculations/methodRuntime";
import type {
  MatrixCalculationMethod,
  MatrixCalculationMethodDefinition,
} from "@/networkDerivation/calculations/types";

export const subjectDifferenceDefinition: MatrixCalculationMethodDefinition = {
  id: "subject_difference",
  label: "Difference between subjects",
  shortLabel: "Subject difference",
  scope: "subject_vs_subject",
  category: "group_comparison",
  description: "Subtracts the right subject connectivity matrix from the left subject matrix.",
  formulaText: "left subject - right subject",
  interpretation: "Positive values indicate higher connectivity in the left subject.",
  requirements: ["Left subject value matrix", "Right subject value matrix"],
  requiredInputs: [
    { role: "leftSubjectValue", label: "Left subject", kind: "subject", statId: "value", sourceLevel: "subject", required: true },
    { role: "rightSubjectValue", label: "Right subject", kind: "subject", statId: "value", sourceLevel: "subject", required: true },
  ],
  outputs: [
    {
      statId: "difference",
      statLabel: "Difference",
      statCategory: "comparison",
      operator: "subject_difference",
      comparisonType: "subject_vs_subject",
      labelSuffix: "difference",
      units: null,
      scaleType: "diverging",
      center: 0,
      rangeMode: "observed_symmetric",
      expectedRange: [-1, 1],
      useDataRange: true,
    },
  ],
  requiresControlOrReference: true,
};

const subjectDifferenceOutput = subjectDifferenceDefinition.outputs[0];

export const calculateSubjectDifference: MatrixCalculationMethod["calculate"] = ({
  request,
  state,
  result,
  existingIds,
}) => {
  request.subjectIds?.forEach((subjectId) => {
    if (subjectId === request.rightSubjectId) return;

    request.layerIds.forEach((layerId) => {
      request.measureIds.forEach((measureId) => {
        const resolved = ensureReady(
          "subject_difference",
          layerId,
          measureId,
          result.skipped,
          request,
          state,
          subjectId,
        );
        if (!resolved) return;
        result.warnings.push(...resolved.warnings);
        const leftSubject = resolved.matrices.leftSubjectValue!;
        const rightSubject = resolved.matrices.rightSubjectValue!;
        const data = createBinaryData(leftSubject, (i, j) => {
          const left = getFiniteMatrixValueOrNull(leftSubject, i, j);
          const right = getFiniteMatrixValueOrNull(rightSubject, i, j);
          return left === null || right === null ? null : left - right;
        });

        maybePush(
          createComparisonMatrix({
            runtime: { state, request, existingIds },
            method: subjectDifferenceDefinition,
            output: subjectDifferenceOutput,
            endpoints: {
              left: { type: "subject", subjectId, matrix: leftSubject },
              right: { type: "subject", subjectId: request.rightSubjectId!, matrix: rightSubject },
            },
            dependencies: [leftSubject.id, rightSubject.id],
            calculation: {
              data,
              statMethod: "left_minus_right",
              formula: "left_subject - right_subject",
              comparisonParameters: {
                leftSubjectMatrixId: leftSubject.id,
                rightSubjectMatrixId: rightSubject.id,
              },
            },
            labelMode: "minus",
          }),
          state,
          result,
        );
      });
    });
  });
};

export const subjectDifference: MatrixCalculationMethod = {
  definition: subjectDifferenceDefinition,
  calculate: calculateSubjectDifference,
};
