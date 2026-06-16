import { getNetworkCalculationMethodDefinitions } from "@/networkDerivation/calculations/methods";
import type {
  CalculationInputRole,
  NetworkCalculationBatchRequest,
  NetworkCalculationOperation,
  NetworkCalculationState,
  ResolvedCalculationInputs,
} from "@/networkDerivation/calculations/types";
import type { Network } from "@/types/network";

const sameContext = (
  network: Network,
  request: NetworkCalculationBatchRequest,
  layerId: string,
  measureId: string,
) =>
  network.context.layerId === layerId &&
  network.measureId === measureId &&
  (request.conditionId === undefined ||
    network.context.conditionId === request.conditionId) &&
  (request.sessionId === undefined ||
    network.context.sessionId === request.sessionId) &&
  (request.taskId === undefined || network.context.taskId === request.taskId);

const hasPopulation = (network: Network, populationId?: string) =>
  Boolean(
    populationId &&
      network.source.type === "population" &&
      network.source.populationId === populationId,
  );

const hasSubject = (network: Network, subjectId?: string) =>
  Boolean(
    subjectId &&
      network.source.type === "subject" &&
      network.source.subjectId === subjectId,
  );

const roleCriteria = (
  role: CalculationInputRole,
  request: NetworkCalculationBatchRequest,
  subjectId?: string,
) => {
  switch (role) {
    case "subjectValue":
      return { sourceType: "subject" as const, statisticId: "value", subjectId };
    case "leftSubjectValue":
      return { sourceType: "subject" as const, statisticId: "value", subjectId };
    case "rightSubjectValue":
      return {
        sourceType: "subject" as const,
        statisticId: "value",
        subjectId: request.rightSubjectId,
      };
    case "targetMean":
      return {
        sourceType: "population" as const,
        statisticId: "mean",
        populationId: request.leftPopulationId,
      };
    case "referenceMean":
      return {
        sourceType: "population" as const,
        statisticId: "mean",
        populationId: request.referencePopulationId ?? request.rightPopulationId,
      };
    case "referenceStd":
      return {
        sourceType: "population" as const,
        statisticId: "std",
        populationId: request.referencePopulationId ?? request.rightPopulationId,
      };
    case "leftMean":
      return {
        sourceType: "population" as const,
        statisticId: "mean",
        populationId: request.leftPopulationId,
      };
    case "rightMean":
      return {
        sourceType: "population" as const,
        statisticId: "mean",
        populationId: request.rightPopulationId,
      };
    case "leftStd":
      return {
        sourceType: "population" as const,
        statisticId: "std",
        populationId: request.leftPopulationId,
      };
    case "rightStd":
      return {
        sourceType: "population" as const,
        statisticId: "std",
        populationId: request.rightPopulationId,
      };
  }
};

const findRoleNetwork = (
  role: CalculationInputRole,
  request: NetworkCalculationBatchRequest,
  state: NetworkCalculationState,
  layerId: string,
  measureId: string,
  subjectId?: string,
) => {
  const criteria = roleCriteria(role, request, subjectId);
  const candidates = state.networks.filter((network) => {
    if (network.source.type !== criteria.sourceType) return false;
    if (network.statisticId !== criteria.statisticId) return false;
    if (!sameContext(network, request, layerId, measureId)) return false;
    if ("subjectId" in criteria) return hasSubject(network, criteria.subjectId);
    return hasPopulation(network, criteria.populationId);
  });

  return {
    network: candidates[0],
    ambiguous: candidates.length > 1,
  };
};

const requiredRolesForOperation = (
  operation: NetworkCalculationOperation,
): CalculationInputRole[] => {
  if (operation === "subject_zscore_vs_population") {
    return ["subjectValue", "referenceMean", "referenceStd"];
  }
  if (operation === "subject_difference") {
    return ["leftSubjectValue", "rightSubjectValue"];
  }
  if (operation === "population_reference_zscore") {
    return ["targetMean", "referenceMean", "referenceStd"];
  }
  if (operation === "population_difference") return ["leftMean", "rightMean"];
  return ["leftMean", "rightMean", "leftStd", "rightStd"];
};

export const resolveCalculationInputsForLayerMeasure = (
  request: NetworkCalculationBatchRequest & {
    operation?: NetworkCalculationOperation;
  },
  state: NetworkCalculationState,
  layerId: string,
  measureId: string,
  subjectId?: string,
): ResolvedCalculationInputs => {
  const operation = request.operation ?? request.operations[0];
  const roles = requiredRolesForOperation(operation);
  const networks: ResolvedCalculationInputs["networks"] = {};
  const warnings: string[] = [];
  const missingRoles: CalculationInputRole[] = [];

  roles.forEach((role) => {
    const { network, ambiguous } = findRoleNetwork(
      role,
      request,
      state,
      layerId,
      measureId,
      subjectId,
    );
    if (!network) {
      missingRoles.push(role);
      return;
    }
    networks[role] = network;
    if (ambiguous) {
      warnings.push(
        `Multiple candidate networks found for ${role}. The first candidate was used.`,
      );
    }
  });

  return { networks, warnings, missingRoles };
};

const sameNodeOrder = (left: Network, right: Network) =>
  left.nodeSetId === right.nodeSetId &&
  left.nodeIds.length === right.nodeIds.length &&
  left.nodeIds.every((nodeId, index) => nodeId === right.nodeIds[index]);

export const assertContextCompatible = (networks: Network[]) => {
  if (networks.length <= 1) return;
  const [first] = networks;
  const incompatible = networks.find(
    (network) =>
      network.context.layerId !== first.context.layerId ||
      network.measureId !== first.measureId ||
      !sameNodeOrder(first, network),
  );
  if (incompatible) {
    throw new Error(`Network '${incompatible.id}' is not compatible with '${first.id}'.`);
  }
};

export const validateNetworkCalculationRequest = (
  request: NetworkCalculationBatchRequest,
  state: NetworkCalculationState,
) => {
  const errors: string[] = [];
  if (!request.operations.length) errors.push("Select at least one calculation method.");
  if (!request.layerIds.length) errors.push("Select at least one layer.");
  if (!request.measureIds.length) errors.push("Select at least one measure.");
  request.operations.forEach((operation) => {
    if (!getNetworkCalculationMethodDefinitions().some((method) => method.id === operation)) {
      errors.push(`Unknown calculation operation '${operation}'.`);
    }
    if (
      (operation === "subject_zscore_vs_population" ||
        operation === "subject_difference") &&
      !request.subjectIds?.length
    ) {
      errors.push("Select at least one subject.");
    }
    if (operation === "subject_difference" && !request.rightSubjectId) {
      errors.push("Select a right/control subject.");
    }
    if (
      operation !== "subject_zscore_vs_population" &&
      operation !== "subject_difference" &&
      !request.leftPopulationId
    ) {
      errors.push("Select a left/target population.");
    }
    if (
      operation !== "subject_zscore_vs_population" &&
      operation !== "subject_difference" &&
      operation !== "population_reference_zscore" &&
      !request.rightPopulationId
    ) {
      errors.push("Select a right/control population.");
    }
    if (operation === "population_reference_zscore" && !request.referencePopulationId) {
      errors.push("Select a reference population.");
    }
  });
  if (!state.networks.length) errors.push("No networks are loaded.");
  return { valid: errors.length === 0, errors };
};

export const getAvailableNetworkCalculations = (state: NetworkCalculationState) => {
  const hasSubjectValue = state.networks.some(
    (network) =>
      network.source.type === "subject" && network.statisticId === "value",
  );
  const populationMeanIds = new Set(
    state.networks
      .filter(
        (network) =>
          network.source.type === "population" &&
          network.statisticId === "mean",
      )
      .map((network) =>
        network.source.type === "population" ? network.source.populationId : "",
      )
      .filter(Boolean),
  );
  const populationStdIds = new Set(
    state.networks
      .filter(
        (network) =>
          network.source.type === "population" &&
          network.statisticId === "std",
      )
      .map((network) =>
        network.source.type === "population" ? network.source.populationId : "",
      )
      .filter(Boolean),
  );
  const populationWithMeanAndStd = [...populationMeanIds].filter((id) =>
    populationStdIds.has(id),
  );
  const subjectScope = hasSubjectValue && populationWithMeanAndStd.length > 0;
  const subjectComparisonScope =
    state.networks.filter(
      (network) =>
        network.source.type === "subject" && network.statisticId === "value",
    ).length >= 2;
  const populationScope = populationMeanIds.size >= 2;
  return getNetworkCalculationMethodDefinitions().filter((method) => {
    if (method.scope === "subject_vs_population") return subjectScope;
    if (method.scope === "subject_vs_subject") return subjectComparisonScope;
    if (method.id === "population_difference") return populationScope;
    return populationWithMeanAndStd.length >= 2;
  });
};

export const findEquivalentDerivedNetwork = (
  candidate: Pick<
    Network,
    "source" | "statisticId" | "context" | "measureId" | "derivation"
  >,
  networkIndex: Record<string, Network>,
) =>
  Object.values(networkIndex).find((network) => {
    if (network.source.type !== candidate.source.type) return false;
    if (network.statisticId !== candidate.statisticId) return false;
    if (network.context.layerId !== candidate.context.layerId) return false;
    if (network.measureId !== candidate.measureId) return false;
    if (
      !candidate.derivation ||
      !network.derivation ||
      candidate.derivation.type !== "comparison" ||
      network.derivation.type !== "comparison"
    ) {
      return false;
    }
    if (network.derivation.operator !== candidate.derivation.operator) return false;
    if (network.derivation.comparisonType !== candidate.derivation.comparisonType) {
      return false;
    }
    if (network.derivation.leftNetworkId !== candidate.derivation.leftNetworkId) {
      return false;
    }
    if (network.derivation.rightNetworkId !== candidate.derivation.rightNetworkId) {
      return false;
    }
    return (
      JSON.stringify(network.derivation.parameters ?? {}) ===
      JSON.stringify(candidate.derivation.parameters ?? {})
    );
  });
