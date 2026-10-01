import { sameDimensions } from "@/networkDerivation/calculations/dimensions";
import { inputSourceId, inputStatisticId } from "@/networkDerivation/calculations/inputStatistics";
import { getNetworkCalculationMethodDefinition, getNetworkCalculationMethodDefinitions } from "@/networkDerivation/calculations/methods";
import { missingSampleSizeIds } from "@/networkDerivation/calculations/sampleSizes";
import type {
  DimensionComparison,
  NetworkCalculationBatchRequest,
  NetworkCalculationInputSpec,
  NetworkCalculationOperation,
  NetworkCalculationState,
  ResolvedCalculationInputs,
} from "@/networkDerivation/calculations/types";
import type { Network } from "@/types/network";

const sourceKind = (state: NetworkCalculationState, sourceId: string) =>
  state.catalogs.sources[sourceId]?.kind;

const findRoleNetwork = (
  input: NetworkCalculationInputSpec,
  operation: NetworkCalculationOperation,
  request: NetworkCalculationBatchRequest,
  state: NetworkCalculationState,
  dimensionPair: DimensionComparison,
  measureId: string,
  subjectId?: string,
) => {
  const { role } = input;
  const statisticId = inputStatisticId(request, operation, input);
  const sourceId = inputSourceId(role, request, subjectId);
  const candidates = state.networks.filter((network) => {
    if (sourceKind(state, network.sourceId) !== input.kind) return false;
    if (network.statisticId !== statisticId) return false;
    const rightRole = role.startsWith("right") || role.startsWith("reference");
    const dimensions = rightRole ? dimensionPair.right : dimensionPair.left;
    if (network.measureId !== measureId || !sameDimensions(network.dimensions, dimensions)) return false;
    return Boolean(sourceId && network.sourceId === sourceId);
  });

  return {
    network: candidates[0],
    ambiguous: candidates.length > 1,
  };
};

export const resolveCalculationInputsForDimensions = (
  request: NetworkCalculationBatchRequest & {
    operation?: NetworkCalculationOperation;
  },
  state: NetworkCalculationState,
  dimensionPair: DimensionComparison,
  measureId: string,
  subjectId?: string,
): ResolvedCalculationInputs => {
  const operation = request.operation ?? request.operations[0];
  const inputs = getNetworkCalculationMethodDefinition(operation)?.requiredInputs ?? [];
  const networks: ResolvedCalculationInputs["networks"] = {};
  const warnings: string[] = [];
  const missingRoles: ResolvedCalculationInputs["missingRoles"] = [];

  inputs.forEach((input) => {
    const { role } = input;
    const { network, ambiguous } = findRoleNetwork(
      input,
      operation,
      request,
      state,
      dimensionPair,
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
        `Multiple candidate networks found for ${role}. Select an unambiguous input context.`,
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
  if (request.operations.length === 1 && request.operations[0] === "correlation") {
    const networks = [request.correlationNetworkAId, request.correlationNetworkBId].map((id) => state.networkIndex[id ?? ""]);
    if (networks.some((network) => !network)) errors.push("Select Network A and Network B.");
    else { try { assertContextCompatible(networks); } catch (error) { errors.push((error as Error).message); } }
    return { valid: !errors.length, errors };
  }
  if (!request.operations.length) errors.push("Select at least one calculation method.");
  if (!request.dimensionPairs.length) errors.push("Select at least one dimension combination.");
  const aspectIds = state.catalogs.aspects.map((aspect) => aspect.id);
  if (request.dimensionPairs.some((pair) => [pair.left, pair.right].some((dimensions) =>
    Object.keys(dimensions).length !== aspectIds.length || aspectIds.some((id) =>
      !state.catalogs.aspectCatalogs[id]?.[dimensions[id]],
    ),
  ))) errors.push("Select valid values for every dimension.");
  missingSampleSizeIds(request, state).forEach((id) =>
    errors.push(`Enter an integer sample size greater than 1 for '${state.catalogs.sources[id]?.label ?? id}'.`),
  );
  if (!request.measureIds.length) errors.push("Select at least one measure.");
  request.operations.forEach((operation) => {
    const method = getNetworkCalculationMethodDefinition(operation);
    if (!method) {
      errors.push(`Unknown calculation operation '${operation}'.`);
      return;
    }
    method.requiredInputs.forEach((input) => {
      const id = inputStatisticId(request, operation, input);
      if (!id || !state.catalogs.statistics[id]) {
        errors.push(`Select a statistic for ${method.label}: ${input.label}.`);
      }
      const sourceIds = input.role === "subjectValue" || input.role === "leftSubjectValue"
        ? request.subjectIds ?? [] : [inputSourceId(input.role, request)];
      if (!sourceIds.length || sourceIds.some((sourceId) =>
        !sourceId || sourceKind(state, sourceId) !== input.kind,
      )) errors.push(`Select a valid source for ${method.label}: ${input.label}.`);
    });
  });
  if (!state.networks.length) errors.push("No networks are loaded.");
  return { valid: errors.length === 0, errors };
};

export const getAvailableNetworkCalculations = (state: NetworkCalculationState) => {
  const kinds = new Set(state.networks.map((network) => sourceKind(state, network.sourceId)));
  // Statistics are assigned by the user; catalog IDs need not be named mean/std/value.
  return getNetworkCalculationMethodDefinitions().filter((method) =>
    method.requiredInputs.every((input) => kinds.has(input.kind)),
  );
};

export const findEquivalentDerivedNetwork = (
  candidate: Pick<
    Network,
    "sourceId" | "statisticId" | "dimensions" | "measureId" | "derivation"
  >,
  networkIndex: Record<string, Network>,
) =>
  Object.values(networkIndex).find((network) => {
    if (network.sourceId !== candidate.sourceId) return false;
    if (network.statisticId !== candidate.statisticId) return false;
    if (!sameDimensions(network.dimensions, candidate.dimensions)) return false;
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
