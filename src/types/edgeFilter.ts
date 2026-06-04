import type { ConnectivityMatrix, UiRangeMode } from "@/types/connectivityBundle";

export type LogicalOperator = "AND" | "OR";

export type MatrixFilterRuleOperator =
  | "between"
  | "outside"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "abs_gte"
  | "abs_between"
  | "negative_and_positive_ranges";

export type MatrixFilterRule = {
  type: "rule";
  id: string;
  joinOperator?: LogicalOperator;
  matrixId: string;
  operator: MatrixFilterRuleOperator;
  min: number | null;
  max: number | null;
  negativeMin?: number | null;
  negativeMax?: number | null;
  positiveMin?: number | null;
  positiveMax?: number | null;
  includeMin: boolean;
  includeMax: boolean;
};

export type MatrixFilterGroup = {
  type: "group";
  id: string;
  operator: LogicalOperator;
  joinOperator?: LogicalOperator;
  children: MatrixFilterExpression[];
};

export type MatrixFilterExpression = MatrixFilterRule | MatrixFilterGroup;

export type MatrixFilterDefinition = {
  root: MatrixFilterGroup;
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
  kind: "roi" | "aggregated";
  rows: number;
  cols: number;
  roiCount: number;
  directed: boolean;
  labelIds: string[];
};

export type MatrixIndex = Record<string, ConnectivityMatrix>;

export type MatrixFilterValidationIssue = {
  id: string;
  severity: "error" | "warning";
  message: string;
  expressionId?: string;
};

export type MatrixFilterValidationResult = {
  valid: boolean;
  errors: MatrixFilterValidationIssue[];
  warnings: MatrixFilterValidationIssue[];
};

export type RuntimeEdgeMaskOptions = {
  maxDepth?: number;
};
