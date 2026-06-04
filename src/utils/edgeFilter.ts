import type { ConnectivityMatrix } from "@/types/connectivityBundle";
import type { Catalogs } from "@/types/connectivityBundle";
import type { DatasetMeta } from "@/types/datasetState";
import type {
  LogicalOperator,
  MatrixFilterDefinition,
  MatrixFilterExpression,
  MatrixFilterGroup,
  MatrixFilterRule,
  MatrixFilterRuleOperator,
  MatrixFilterValidationIssue,
  MatrixFilterValidationResult,
  MatrixIndex,
  NetworkEdgeDomain,
  RuntimeEdgeMask,
  RuntimeEdgeMaskOptions,
} from "@/types/edgeFilter";
import { getMatrixValue } from "@/utils/connectivityMatrix";
import { resolveValueDomain } from "@/utils/valueDomain";

export const MAX_MATRIX_FILTER_DEPTH = 5;

const ruleOperators = new Set<MatrixFilterRuleOperator>([
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

export const createMatrixFilterId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const createEmptyMatrixFilterGroup = (
  operator: LogicalOperator = "AND",
): MatrixFilterGroup => ({
  type: "group",
  id: createMatrixFilterId("group"),
  operator,
  children: [],
});

export const createEmptyMatrixFilterDefinition = (
  uiRangeMode: MatrixFilterDefinition["uiRangeMode"] = "view_observed",
): MatrixFilterDefinition => ({
  root: createEmptyMatrixFilterGroup("AND"),
  uiRangeMode,
});

export const createDraftMatrixFilterRule = (
  matrix?: ConnectivityMatrix,
): MatrixFilterRule => {
  return {
    type: "rule",
    id: createMatrixFilterId("rule"),
    matrixId: matrix?.id ?? "",
    operator: "between",
    min: null,
    max: null,
    includeMin: true,
    includeMax: true,
  };
};

export const cloneMatrixFilterDefinition = (
  definition: MatrixFilterDefinition,
): MatrixFilterDefinition => JSON.parse(JSON.stringify(definition)) as MatrixFilterDefinition;

const normalizeRuleForRange = (
  rule: MatrixFilterRule,
  matrixIndex: MatrixIndex,
  catalogs: Catalogs | undefined,
  uiRangeMode: MatrixFilterDefinition["uiRangeMode"],
): MatrixFilterRule => {
  const matrix = matrixIndex[rule.matrixId];
  if (!matrix) return { ...rule, operator: "between" };

  const range = resolveValueDomain({
    matrix,
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
  expression: MatrixFilterExpression,
  matrixIndex: MatrixIndex,
  catalogs: Catalogs | undefined,
  uiRangeMode: MatrixFilterDefinition["uiRangeMode"],
): MatrixFilterExpression => {
  if (expression.type === "rule") {
    return normalizeRuleForRange(
      expression,
      matrixIndex,
      catalogs,
      uiRangeMode,
    );
  }

  return {
    ...expression,
    children: expression.children.map((child) =>
      normalizeExpressionForRanges(
        child,
        matrixIndex,
        catalogs,
        uiRangeMode,
      ),
    ),
  };
};

export const normalizeMatrixFilterDefinitionForRanges = (
  definition: MatrixFilterDefinition,
  matrixIndex: MatrixIndex,
  catalogs: Catalogs | undefined,
  uiRangeMode: MatrixFilterDefinition["uiRangeMode"],
): MatrixFilterDefinition => ({
  ...definition,
  uiRangeMode,
  root: normalizeExpressionForRanges(
    definition.root,
    matrixIndex,
    catalogs,
    uiRangeMode,
  ) as MatrixFilterGroup,
});

export const buildNetworkEdgeDomain = (
  dataset: DatasetMeta | null,
  labelIds: string[],
): NetworkEdgeDomain | null => {
  const connectivity = dataset?.content;
  const firstMatrix = connectivity?.matrices.find((matrix) => matrix.kind !== "aggregated");
  if (!connectivity || !firstMatrix) return null;

  const [rows, cols] = firstMatrix.geometry.shape;
  const directed = connectivity.matrices.some((matrix) => !matrix.encoding.symmetric);
  const roiCount = labelIds.length > 0 ? labelIds.length : rows;
  const key = `${firstMatrix.geometry.atlasId}:${rows}x${cols}:${connectivity.roiOrderHash}`;
  const atlasName = connectivity.atlas.name || firstMatrix.geometry.atlasId;

  return {
    key,
    label: `${atlasName} · ${roiCount} ROIs · ${rows}x${cols}`,
    kind: "roi",
    rows,
    cols,
    roiCount,
    directed,
    labelIds,
  };
};

export const buildAggregatedEdgeDomain = (
  dataset: DatasetMeta | null,
): NetworkEdgeDomain | null => {
  const matrix = dataset?.content?.matrices.find(
    (item) => item.kind === "aggregated" && item.geometry.roiOrder,
  );
  if (!matrix?.geometry.roiOrder) return null;
  const [rows, cols] = matrix.geometry.shape;
  const labels = matrix.geometry.roiOrder;
  return {
    key: `${matrix.geometry.atlasId}:${rows}x${cols}:${labels.join("|")}`,
    label: `${rows} ROI groups · ${rows}x${cols}`,
    kind: "aggregated",
    rows,
    cols,
    roiCount: labels.length,
    directed: !matrix.encoding.symmetric,
    labelIds: labels,
  };
};

const addIssue = (
  target: MatrixFilterValidationIssue[],
  severity: MatrixFilterValidationIssue["severity"],
  message: string,
  expressionId?: string,
) => {
  target.push({
    id: createMatrixFilterId(severity),
    severity,
    message,
    expressionId,
  });
};

const requiredValuesMissing = (rule: MatrixFilterRule) => {
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
  rule: MatrixFilterRule,
  matrixIndex: MatrixIndex,
  edgeDomain: NetworkEdgeDomain,
  errors: MatrixFilterValidationIssue[],
  warnings: MatrixFilterValidationIssue[],
) => {
  if (!rule.matrixId) addIssue(errors, "error", "Select a matrix for every rule.", rule.id);
  const matrix = matrixIndex[rule.matrixId];
  if (rule.matrixId && !matrix) {
    addIssue(errors, "error", "The selected matrix is not available.", rule.id);
  }
  if (matrix && edgeDomain.kind === "roi" && matrix.kind === "aggregated") {
    addIssue(errors, "error", "Aggregated matrices require Filter aggregated edges.", rule.id);
  }
  if (matrix && edgeDomain.kind === "aggregated") {
    const sameShape =
      matrix.geometry.shape[0] === edgeDomain.rows &&
      matrix.geometry.shape[1] === edgeDomain.cols;
    const sameOrder =
      Array.isArray(matrix.geometry.roiOrder) &&
      matrix.geometry.roiOrder.length === edgeDomain.labelIds.length &&
      matrix.geometry.roiOrder.every((id, index) => id === edgeDomain.labelIds[index]);
    if (matrix.kind !== "aggregated" || !sameShape || !sameOrder) {
      addIssue(
        errors,
        "error",
        "No se puede usar una matriz ROI × ROI directamente para filtrar una matriz agregada. Primero genera una versión agregada compatible de esa matriz.",
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
  if (matrix?.dataStats) {
    const nullish = matrix.dataStats.allValues.nullCount;
    if (nullish > 0) {
      addIssue(warnings, "warning", "The selected matrix contains values that predicates will ignore.", rule.id);
    }
  }
};

const validateExpression = (
  expression: MatrixFilterExpression,
  matrixIndex: MatrixIndex,
  edgeDomain: NetworkEdgeDomain,
  errors: MatrixFilterValidationIssue[],
  warnings: MatrixFilterValidationIssue[],
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
    validateRule(expression, matrixIndex, edgeDomain, errors, warnings);
    return;
  }
  if (!groupOperators.has(expression.operator)) {
    addIssue(errors, "error", "Select a valid group operator.", expression.id);
  }
  if (expression.children.length === 0) {
    addIssue(errors, "error", "Every group must contain at least one rule or group.", expression.id);
  }
  expression.children.forEach((child) =>
      validateExpression(child, matrixIndex, edgeDomain, errors, warnings, seen, depth + 1, maxDepth),
  );
};

export const validateMatrixFilterDefinition = (
  filter: MatrixFilterDefinition,
  matrixIndex: MatrixIndex,
  edgeDomain: NetworkEdgeDomain,
  options?: RuntimeEdgeMaskOptions,
): MatrixFilterValidationResult => {
  const errors: MatrixFilterValidationIssue[] = [];
  const warnings: MatrixFilterValidationIssue[] = [];

  if (!edgeDomain || edgeDomain.rows <= 0 || edgeDomain.cols <= 0) {
    addIssue(errors, "error", "The network edge domain is not available.");
  }
  if (!filter.root || filter.root.type !== "group") {
    addIssue(errors, "error", "The root filter group is missing.");
  } else {
    validateExpression(
      filter.root,
      matrixIndex,
      edgeDomain,
      errors,
      warnings,
      new Set(),
      1,
      options?.maxDepth ?? MAX_MATRIX_FILTER_DEPTH,
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

export const evaluateMatrixFilterRule = (
  rule: MatrixFilterRule,
  i: number,
  j: number,
  matrixIndex: MatrixIndex,
): boolean => {
  const matrix = matrixIndex[rule.matrixId];
  if (!matrix) return false;
  const value = getMatrixValue(matrix, i, j);
  if (value === null || !Number.isFinite(value)) return false;

  switch (rule.operator) {
    case "between":
      return rule.min !== null && rule.max !== null
        ? compareRange(value, rule.min, rule.max, rule.includeMin, rule.includeMax)
        : false;
    case "outside":
      return rule.min !== null && rule.max !== null ? value < rule.min || value > rule.max : false;
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

export const evaluateMatrixFilterExpression = (
  expression: MatrixFilterExpression,
  i: number,
  j: number,
  matrixIndex: MatrixIndex,
): boolean => {
  if (expression.type === "rule") {
    return evaluateMatrixFilterRule(expression, i, j, matrixIndex);
  }
  if (expression.children.length === 0) return false;

  const [firstChild, ...remainingChildren] = expression.children;
  let result = evaluateMatrixFilterExpression(firstChild, i, j, matrixIndex);

  for (const child of remainingChildren) {
    const next = evaluateMatrixFilterExpression(child, i, j, matrixIndex);
    const joinOperator = child.joinOperator ?? expression.operator;
    result = joinOperator === "AND" ? result && next : result || next;
  }

  return result;
};

export const createRuntimeEdgeMask = (
  filter: MatrixFilterDefinition,
  matrixIndex: MatrixIndex,
  edgeDomain: NetworkEdgeDomain,
): RuntimeEdgeMask => {
  const values = Array.from({ length: edgeDomain.rows }, () =>
    Array.from({ length: edgeDomain.cols }, () => false),
  );
  let selectedCount = 0;
  let totalCount = 0;

  for (let i = 0; i < edgeDomain.rows; i += 1) {
    for (let j = 0; j < edgeDomain.cols; j += 1) {
      if (!edgeDomain.directed && j < i) continue;

      totalCount += 1;
      const selected = evaluateMatrixFilterExpression(filter.root, i, j, matrixIndex);
      values[i][j] = selected;
      if (!edgeDomain.directed && i !== j) values[j][i] = selected;
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
