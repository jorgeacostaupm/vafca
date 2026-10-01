import type { Network, UiRangeMode } from "@/types/network";

export type LogicalOperator = "AND" | "OR";

export type NetworkFilterRuleOperator =
  | "between"
  | "outside"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "abs_gte"
  | "abs_between"
  | "negative_and_positive_ranges";

export type NetworkFilterRule = {
  type: "rule";
  id: string;
  joinOperator?: LogicalOperator;
  networkId: string;
  operator: NetworkFilterRuleOperator;
  min: number | null;
  max: number | null;
  negativeMin?: number | null;
  negativeMax?: number | null;
  positiveMin?: number | null;
  positiveMax?: number | null;
  includeMin: boolean;
  includeMax: boolean;
};

export type NetworkFilterGroup = {
  type: "group";
  id: string;
  operator: LogicalOperator;
  joinOperator?: LogicalOperator;
  children: NetworkFilterExpression[];
};

export type NetworkFilterExpression =
  | NetworkFilterRule
  | NetworkFilterGroup;

export type NetworkFilterDefinition = {
  root: NetworkFilterGroup;
  uiRangeMode: UiRangeMode;
};

export type RuntimeEdgeMask = {
  edgeDomainKey: string;
  values: boolean[][];
  selectedCount: number;
  totalCount: number;
};

export type NetworkEdgeDomain = {
  key: string;
  label: string;
  kind: "nodes" | "aggregated";
  rows: number;
  cols: number;
  nodeCount: number;

  labelIds: string[];
};

export type NetworkIndex = Record<string, Network>;

export type NetworkFilterValidationIssue = {
  id: string;
  severity: "error" | "warning";
  message: string;
  expressionId?: string;
};

export type NetworkFilterValidationResult = {
  valid: boolean;
  errors: NetworkFilterValidationIssue[];
  warnings: NetworkFilterValidationIssue[];
};

export type RuntimeEdgeMaskOptions = {
  maxDepth?: number;
};
