import { createComparisonNetwork } from "@/networkDerivation/calculations/comparisonNetworkRecord";
import { getFiniteMatrixValueOrNull } from "@/networkDerivation/calculations/matrixMath";
import {
  createBinaryData,
  ensureReady,
  maybePush,
} from "@/networkDerivation/calculations/methodRuntime";
import type {
  NetworkCalculationMethod,
  NetworkCalculationMethodDefinition,
} from "@/networkDerivation/calculations/types";

export const subjectDifferenceDefinition: NetworkCalculationMethodDefinition = {
  id: "subject_difference",
  label: "Difference between subjects",
  shortLabel: "Subject difference",
  scope: "subject_vs_subject",
  category: "group_comparison",
  description: "Subtracts the right subject network from the left subject network.",
  formulaText: "left subject - right subject",
  interpretation: "Positive values indicate higher connectivity in the left subject.",
  requirements: ["Left subject value network", "Right subject value network"],
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

export const calculateSubjectDifference: NetworkCalculationMethod["calculate"] = ({
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
        const leftSubject = resolved.networks.leftSubjectValue!;
        const rightSubject = resolved.networks.rightSubjectValue!;
        const data = createBinaryData(leftSubject, (i, j) => {
          const left = getFiniteMatrixValueOrNull(leftSubject, i, j);
          const right = getFiniteMatrixValueOrNull(rightSubject, i, j);
          return left === null || right === null ? null : left - right;
        });

        maybePush(
          createComparisonNetwork({
            runtime: { state, request, existingIds },
            method: subjectDifferenceDefinition,
            output: subjectDifferenceOutput,
            endpoints: {
              left: { type: "subject", subjectId, network: leftSubject },
              right: { type: "subject", subjectId: request.rightSubjectId!, network: rightSubject },
            },
            dependencies: [leftSubject.id, rightSubject.id],
            calculation: {
              data,
              statMethod: "left_minus_right",
              formula: "left_subject - right_subject",
              comparisonParameters: {
                leftSubjectNetworkId: leftSubject.id,
                rightSubjectNetworkId: rightSubject.id,
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

export const subjectDifference: NetworkCalculationMethod = {
  definition: subjectDifferenceDefinition,
  calculate: calculateSubjectDifference,
};
