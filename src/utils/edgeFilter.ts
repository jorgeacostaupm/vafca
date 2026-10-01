import type { DatasetMeta } from "@/types/datasetState";
import type {
  LogicalOperator,
  NetworkEdgeDomain,
  NetworkFilterDefinition,
  NetworkFilterExpression,
  NetworkFilterGroup,
  NetworkFilterRule,
  NetworkFilterRuleOperator,
  NetworkFilterValidationIssue,
  NetworkFilterValidationResult,
  NetworkIndex,
  RuntimeEdgeMask,
  RuntimeEdgeMaskOptions,
} from "@/types/edgeFilter";
import type { Catalogs, Network, UiRangeMode } from "@/types/network";
import { getNetworkValue } from "@/utils/networkData";
import { resolveValueDomain } from "@/utils/valueDomain";

export const MAX_NETWORK_FILTER_DEPTH = 5;

const ruleOperators = new Set<NetworkFilterRuleOperator>([
  "between",
  "outside",
  "lt",
  "lte",
  "gt",
  "gte",
  "abs_gte",
  "abs_between",
  "negative_and_positive_ranges",
]);

const groupOperators = new Set<LogicalOperator>(["AND", "OR"]);

export const createNetworkFilterId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const createEmptyNetworkFilterGroup = (
  operator: LogicalOperator = "AND",
): NetworkFilterGroup => ({
  type: "group",
  id: createNetworkFilterId("group"),
  operator,
  children: [],
});

export const createEmptyNetworkFilterDefinition = (
  uiRangeMode: NetworkFilterDefinition["uiRangeMode"] = "view_observed",
): NetworkFilterDefinition => ({
  root: createEmptyNetworkFilterGroup("AND"),
  uiRangeMode,
});

export const createDraftNetworkFilterRule = (
  network?: Network,
): NetworkFilterRule => ({
  type: "rule",
  id: createNetworkFilterId("rule"),
  networkId: network?.id ?? "",
  operator: "between",
  min: null,
  max: null,
  includeMin: true,
  includeMax: true,
});

export const cloneNetworkFilterDefinition = (
  definition: NetworkFilterDefinition,
): NetworkFilterDefinition =>
  JSON.parse(JSON.stringify(definition)) as NetworkFilterDefinition;

type ResolvedNetworkRange = {
  min: number;
  max: number;
  scaleType: "sequential" | "diverging";
};

export const resolveNetworkFilterRange = ({
  network,
  catalogs,
  mode,
}: {
  network: Network;
  catalogs: Catalogs | undefined;
  mode: UiRangeMode;
}): ResolvedNetworkRange => {
  const { min, max, scaleType } = resolveValueDomain({ network, catalogs, mode });
  return { min, max, scaleType };
};

const normalizeRuleForRange = (
  rule: NetworkFilterRule,
  networkIndex: NetworkIndex,
  catalogs: Catalogs | undefined,
  uiRangeMode: NetworkFilterDefinition["uiRangeMode"],
): NetworkFilterRule => {
  const network = networkIndex[rule.networkId];
  if (!network) return { ...rule, operator: "between" };

  const range = resolveNetworkFilterRange({
    network,
    catalogs,
    mode: uiRangeMode,
  });
  if (range.scaleType === "diverging") {
    return {
      ...rule,
      operator: "negative_and_positive_ranges",
      min: null,
      max: null,
      negativeMin: rule.negativeMin ?? range.min,
      negativeMax: rule.negativeMax ?? Math.min(0, range.max),
      positiveMin: rule.positiveMin ?? Math.max(0, range.min),
      positiveMax: rule.positiveMax ?? range.max,
    };
  }

  return {
    ...rule,
    operator: "between",
    min: rule.min ?? range.min,
    max: rule.max ?? range.max,
    negativeMin: null,
    negativeMax: null,
    positiveMin: null,
    positiveMax: null,
  };
};

const normalizeExpressionForRanges = (
  expression: NetworkFilterExpression,
  networkIndex: NetworkIndex,
  catalogs: Catalogs | undefined,
  uiRangeMode: NetworkFilterDefinition["uiRangeMode"],
): NetworkFilterExpression => {
  if (expression.type === "rule") {
    return normalizeRuleForRange(
      expression,
      networkIndex,
      catalogs,
      uiRangeMode,
    );
  }

  return {
    ...expression,
    children: expression.children.map((child) =>
      normalizeExpressionForRanges(child, networkIndex, catalogs, uiRangeMode),
    ),
  };
};

export const normalizeNetworkFilterDefinitionForRanges = (
  definition: NetworkFilterDefinition,
  networkIndex: NetworkIndex,
  catalogs: Catalogs | undefined,
  uiRangeMode: NetworkFilterDefinition["uiRangeMode"],
): NetworkFilterDefinition => ({
  ...definition,
  uiRangeMode,
  root: normalizeExpressionForRanges(
    definition.root,
    networkIndex,
    catalogs,
    uiRangeMode,
  ) as NetworkFilterGroup,
});

export const buildNetworkEdgeDomain = (
  dataset: DatasetMeta | null,
  labelIds: string[],
): NetworkEdgeDomain | null => {
  const content = dataset?.content;
  const firstNetwork = content?.networks.find(
    (network) => network.derivation?.type !== "aggregation",
  );
  if (!content || !firstNetwork) return null;

  const rows = firstNetwork.nodeIds.length;
  const cols = rows;
  const nodeCount = labelIds.length > 0 ? labelIds.length : rows;
  const key = `${content.nodeSet.id}:${rows}x${cols}:${labelIds.join("|")}`;
  const label = `${content.nodeSet.label} · ${nodeCount} ${content.nodeSet.terminology.plural} · ${rows}x${cols}`;

  return {
    key,
    label,
    kind: "nodes",
    rows,
    cols,
    nodeCount,
    labelIds,
  };
};

export const buildAggregatedEdgeDomain = (
  dataset: DatasetMeta | null,
): NetworkEdgeDomain | null => {
  const network = dataset?.content?.networks.find(
    (item) => item.derivation?.type === "aggregation",
  );
  if (!network) return null;
  const rows = network.nodeIds.length;
  const labels = network.nodeIds;
  return {
    key: `${network.nodeSetId}:${rows}x${rows}:${labels.join("|")}`,
    label: `${rows} node groups · ${rows}x${rows}`,
    kind: "aggregated",
    rows,
    cols: rows,
    nodeCount: labels.length,

    labelIds: labels,
  };
};

const addIssue = (
  target: NetworkFilterValidationIssue[],
  severity: NetworkFilterValidationIssue["severity"],
  message: string,
  expressionId?: string,
) => {
  target.push({
    id: createNetworkFilterId(severity),
    severity,
    message,
    expressionId,
  });
};

const requiredValuesMissing = (rule: NetworkFilterRule) => {
  if (["between", "outside", "abs_between"].includes(rule.operator)) {
    return rule.min === null || rule.max === null;
  }
  if (["lt", "lte"].includes(rule.operator)) return rule.max === null;
  if (["gt", "gte", "abs_gte"].includes(rule.operator)) return rule.min === null;
  return (
    rule.negativeMin === null ||
    rule.negativeMin === undefined ||
    rule.negativeMax === null ||
    rule.negativeMax === undefined ||
    rule.positiveMin === null ||
    rule.positiveMin === undefined ||
    rule.positiveMax === null ||
    rule.positiveMax === undefined
  );
};

const validateRule = (
  rule: NetworkFilterRule,
  networkIndex: NetworkIndex,
  edgeDomain: NetworkEdgeDomain,
  errors: NetworkFilterValidationIssue[],
  warnings: NetworkFilterValidationIssue[],
) => {
  if (!rule.networkId) {
    addIssue(errors, "error", "Select a network for every rule.", rule.id);
  }
  const network = networkIndex[rule.networkId];
  if (rule.networkId && !network) {
    addIssue(errors, "error", "The selected network is not available.", rule.id);
  }
  if (
    network &&
    edgeDomain.kind === "nodes" &&
    network.derivation?.type === "aggregation"
  ) {
    addIssue(errors, "error", "Aggregated networks cannot be filtered.", rule.id);
  }
  if (network && edgeDomain.kind === "aggregated") {
    const sameShape =
      network.nodeIds.length === edgeDomain.rows &&
      network.nodeIds.length === edgeDomain.cols;
    const sameOrder =
      network.nodeIds.length === edgeDomain.labelIds.length &&
      network.nodeIds.every((id, index) => id === edgeDomain.labelIds[index]);
    if (network.derivation?.type !== "aggregation" || !sameShape || !sameOrder) {
      addIssue(
        errors,
        "error",
        "No se puede usar una red de nodos directamente para filtrar una red agregada. Primero genera una version agregada compatible de esa red.",
        rule.id,
      );
    }
  }
  if (!ruleOperators.has(rule.operator)) {
    addIssue(errors, "error", "Select a valid rule operator.", rule.id);
  }
  if (requiredValuesMissing(rule)) {
    addIssue(errors, "error", "Enter all required threshold values.", rule.id);
  }
  if (rule.min !== null && rule.max !== null && rule.min > rule.max) {
    addIssue(errors, "error", "Minimum threshold cannot be greater than maximum threshold.", rule.id);
  }
  if (
    rule.negativeMin !== null &&
    rule.negativeMin !== undefined &&
    rule.negativeMax !== null &&
    rule.negativeMax !== undefined &&
    rule.negativeMin > rule.negativeMax
  ) {
    addIssue(errors, "error", "Negative range minimum cannot be greater than its maximum.", rule.id);
  }
  if (
    rule.positiveMin !== null &&
    rule.positiveMin !== undefined &&
    rule.positiveMax !== null &&
    rule.positiveMax !== undefined &&
    rule.positiveMin > rule.positiveMax
  ) {
    addIssue(errors, "error", "Positive range minimum cannot be greater than its maximum.", rule.id);
  }
  if (network?.dataStats?.allValues.nullCount) {
    addIssue(warnings, "warning", "The selected network contains values that predicates will ignore.", rule.id);
  }
};

const validateExpression = (
  expression: NetworkFilterExpression,
  networkIndex: NetworkIndex,
  edgeDomain: NetworkEdgeDomain,
  errors: NetworkFilterValidationIssue[],
  warnings: NetworkFilterValidationIssue[],
  seen: Set<string>,
  depth: number,
  maxDepth: number,
) => {
  if (seen.has(expression.id)) {
    addIssue(errors, "error", "The filter contains a circular or duplicated expression id.", expression.id);
    return;
  }
  seen.add(expression.id);
  if (depth > maxDepth) {
    addIssue(errors, "error", "Maximum group depth exceeded.", expression.id);
  }
  if (expression.joinOperator && !groupOperators.has(expression.joinOperator)) {
    addIssue(errors, "error", "Select a valid AND/OR connector.", expression.id);
  }
  if (expression.type === "rule") {
    validateRule(expression, networkIndex, edgeDomain, errors, warnings);
    return;
  }
  if (!groupOperators.has(expression.operator)) {
    addIssue(errors, "error", "Select a valid group operator.", expression.id);
  }
  if (expression.children.length === 0) {
    addIssue(errors, "error", "Every group must contain at least one rule or group.", expression.id);
  }
  expression.children.forEach((child) =>
    validateExpression(
      child,
      networkIndex,
      edgeDomain,
      errors,
      warnings,
      seen,
      depth + 1,
      maxDepth,
    ),
  );
};

export const validateNetworkFilterDefinition = (
  filter: NetworkFilterDefinition,
  networkIndex: NetworkIndex,
  edgeDomain: NetworkEdgeDomain,
  options?: RuntimeEdgeMaskOptions,
): NetworkFilterValidationResult => {
  const errors: NetworkFilterValidationIssue[] = [];
  const warnings: NetworkFilterValidationIssue[] = [];

  if (!edgeDomain || edgeDomain.rows <= 0 || edgeDomain.cols <= 0) {
    addIssue(errors, "error", "The network edge domain is not available.");
  }
  if (!filter.root || filter.root.type !== "group") {
    addIssue(errors, "error", "The root filter group is missing.");
  } else {
    validateExpression(
      filter.root,
      networkIndex,
      edgeDomain,
      errors,
      warnings,
      new Set(),
      1,
      options?.maxDepth ?? MAX_NETWORK_FILTER_DEPTH,
    );
  }

  return { valid: errors.length === 0, errors, warnings };
};

const compareRange = (
  value: number,
  min: number,
  max: number,
  includeMin: boolean,
  includeMax: boolean,
) => {
  const aboveMin = includeMin ? value >= min : value > min;
  const belowMax = includeMax ? value <= max : value < max;
  return aboveMin && belowMax;
};

export const evaluateNetworkFilterRule = (
  rule: NetworkFilterRule,
  i: number,
  j: number,
  networkIndex: NetworkIndex,
): boolean => {
  const network = networkIndex[rule.networkId];
  if (!network) return false;
  const sourceNodeId = network.nodeIds[i];
  const targetNodeId = network.nodeIds[j];
  if (!sourceNodeId || !targetNodeId) return false;
  const value = getNetworkValue(network, sourceNodeId, targetNodeId);
  if (value === null || !Number.isFinite(value)) return false;

  switch (rule.operator) {
    case "between":
      return rule.min !== null && rule.max !== null
        ? compareRange(value, rule.min, rule.max, rule.includeMin, rule.includeMax)
        : false;
    case "outside":
      return rule.min !== null && rule.max !== null
        ? value < rule.min || value > rule.max
        : false;
    case "lt":
      return rule.max !== null ? value < rule.max : false;
    case "lte":
      return rule.max !== null ? value <= rule.max : false;
    case "gt":
      return rule.min !== null ? value > rule.min : false;
    case "gte":
      return rule.min !== null ? value >= rule.min : false;
    case "abs_gte":
      return rule.min !== null ? Math.abs(value) >= rule.min : false;
    case "abs_between":
      return rule.min !== null && rule.max !== null
        ? compareRange(Math.abs(value), rule.min, rule.max, rule.includeMin, rule.includeMax)
        : false;
    case "negative_and_positive_ranges":
      return (
        rule.negativeMin !== null &&
        rule.negativeMin !== undefined &&
        rule.negativeMax !== null &&
        rule.negativeMax !== undefined &&
        rule.positiveMin !== null &&
        rule.positiveMin !== undefined &&
        rule.positiveMax !== null &&
        rule.positiveMax !== undefined &&
        (compareRange(value, rule.negativeMin, rule.negativeMax, rule.includeMin, rule.includeMax) ||
          compareRange(value, rule.positiveMin, rule.positiveMax, rule.includeMin, rule.includeMax))
      );
    default:
      return false;
  }
};

export const evaluateNetworkFilterExpression = (
  expression: NetworkFilterExpression,
  i: number,
  j: number,
  networkIndex: NetworkIndex,
): boolean => {
  if (expression.type === "rule") {
    return evaluateNetworkFilterRule(expression, i, j, networkIndex);
  }
  if (expression.children.length === 0) return false;

  const [firstChild, ...remainingChildren] = expression.children;
  let result = evaluateNetworkFilterExpression(firstChild, i, j, networkIndex);

  for (const child of remainingChildren) {
    const next = evaluateNetworkFilterExpression(child, i, j, networkIndex);
    const joinOperator = child.joinOperator ?? expression.operator;
    result = joinOperator === "AND" ? result && next : result || next;
  }

  return result;
};

export const createRuntimeEdgeMask = (
  filter: NetworkFilterDefinition,
  networkIndex: NetworkIndex,
  edgeDomain: NetworkEdgeDomain,
): RuntimeEdgeMask => {
  const values = Array.from({ length: edgeDomain.rows }, () =>
    Array.from({ length: edgeDomain.cols }, () => false),
  );
  let selectedCount = 0;
  let totalCount = 0;

  for (let i = 0; i < edgeDomain.rows; i += 1) {
    for (let j = 0; j < edgeDomain.cols; j += 1) {
      if (j < i) continue;

      totalCount += 1;
      const selected = evaluateNetworkFilterExpression(filter.root, i, j, networkIndex);
      values[i][j] = selected;
      if (i !== j) values[j][i] = selected;
      if (selected) selectedCount += 1;
    }
  }

  return {
    edgeDomainKey: edgeDomain.key,
    values,
    selectedCount,
    totalCount,
  };
};
