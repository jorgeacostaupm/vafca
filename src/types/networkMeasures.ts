import type { MatrixKind } from "@/types/connectivityBundle";
import type { NetworkMatrixSelectorMode } from "@/types/networkVisualization";

export type NetworkSummaryStatus = "idle" | "loading" | "ready" | "error";
export type NetworkSummaryScope = "complete" | "filtered";

export type NetworkSummaryFieldId =
  | "identity.matrixId"
  | "identity.label"
  | "identity.kind"
  | "identity.measure"
  | "identity.statistic"
  | "identity.layer"
  | "identity.population"
  | "identity.matrixSize"
  | "identity.nodeCount"
  | "identity.symmetric"
  | "identity.directed"
  | "identity.networkKind"
  | "identity.scope"
  | "coverage.nodeCount"
  | "coverage.possibleEdgeCount"
  | "coverage.evaluatedEdgeCount"
  | "coverage.usedEdgeCount"
  | "coverage.invalidEdgeCount"
  | "coverage.zeroEdgeCount"
  | "coverage.density"
  | "coverage.sparsity"
  | "coverage.positiveEdgePercent"
  | "coverage.negativeEdgePercent"
  | "coverage.zeroEdgePercent"
  | "weights.min"
  | "weights.max"
  | "weights.mean"
  | "weights.median"
  | "weights.standardDeviation"
  | "weights.meanAbs"
  | "weights.sum"
  | "weights.sumAbs"
  | "weights.sumPositive"
  | "weights.sumNegative"
  | "weights.percentile05"
  | "weights.percentile25"
  | "weights.percentile50"
  | "weights.percentile75"
  | "weights.percentile95"
  | "global.meanDegree"
  | "global.maxDegree"
  | "global.componentCount"
  | "global.giantComponentSize"
  | "global.giantComponentRatio"
  | "global.isolatedNodeCount"
  | "global.meanClustering"
  | "global.transitivity"
  | "global.globalEfficiency"
  | "global.averagePathLength"
  | "global.diameter"
  | "nodes.topByDegree"
  | "nodes.isolated"
  | "links.topAbs"
  | "links.topPositive"
  | "links.topNegative"
  | "groups.summary";

export type NetworkSummaryFieldVisibility = {
  summaryTab: boolean;
  viewSummaries: boolean;
};

export type NetworkSummarySettings = {
  includeDiagonal: boolean;
  includeZeroEdges: boolean;
  topItemsLimit: number;
  visibleFields: Record<NetworkSummaryFieldId, NetworkSummaryFieldVisibility>;
};

export type NetworkSummaryControlsState = {
  matrixSelectorMode: NetworkMatrixSelectorMode;
  populationKey: string;
  measureId: string;
  statId: string;
  layerId: string;
  selectedCompoundId: string;
};

export type NetworkSummaryIdentity = {
  matrixId: string;
  compoundId: string;
  label: string;
  kind: MatrixKind;
  measureLabel: string;
  statisticLabel: string;
  layerLabel: string;
  populationLabel: string;
  matrixSize: string;
  nodeCount: number;
  symmetric: boolean;
  directed: boolean;
  networkKind: "roi" | "aggregated";
  scope: NetworkSummaryScope;
};

export type NetworkSummaryCoverage = {
  nodeCount: number;
  possibleEdgeCount: number;
  evaluatedEdgeCount: number;
  usedEdgeCount: number;
  invalidEdgeCount: number;
  zeroEdgeCount: number;
  positiveEdgeCount: number;
  negativeEdgeCount: number;
  density: number | null;
  sparsity: number | null;
  positiveEdgePercent: number | null;
  negativeEdgePercent: number | null;
  zeroEdgePercent: number | null;
};

export type NetworkWeightDistribution = {
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  standardDeviation: number | null;
  meanAbs: number | null;
  sum: number;
  sumAbs: number;
  sumPositive: number;
  sumNegative: number;
  percentile05: number | null;
  percentile25: number | null;
  percentile50: number | null;
  percentile75: number | null;
  percentile95: number | null;
};

export type NetworkGlobalMeasures = {
  meanDegree: number | null;
  maxDegree: number;
  componentCount: number;
  giantComponentSize: number;
  giantComponentRatio: number | null;
  isolatedNodeCount: number;
  meanClustering: number | null;
  transitivity: number | null;
  globalEfficiency: number | null;
  averagePathLength: number | null;
  diameter: number | null;
};

export type NetworkNodeSummary = {
  id: string;
  label: string;
  groupLabel?: string;
  degree: number;
  isolated: boolean;
  clustering: number | null;
};

export type NetworkLinkSummary = {
  id: string;
  sourceId: string;
  targetId: string;
  sourceLabel: string;
  targetLabel: string;
  sourceGroupLabel?: string;
  targetGroupLabel?: string;
  value: number;
};

export type NetworkGroupSummary = {
  id: string;
  label: string;
  roiCount: number;
  internalPossibleEdgeCount: number;
  internalEdgeCount: number;
  internalDensity: number | null;
  externalPossibleEdgeCount: number;
  externalEdgeCount: number;
  externalDensity: number | null;
};

export type NetworkSummaryGrouping = {
  fields: string[];
  source: "activeGrouping" | "firstTag" | "unavailable";
  unavailableReason?: string;
};

export type NetworkSummaryResult = {
  identity: NetworkSummaryIdentity;
  coverage: NetworkSummaryCoverage;
  weights: NetworkWeightDistribution;
  global: NetworkGlobalMeasures;
  nodes: NetworkNodeSummary[];
  topNodesByDegree: NetworkNodeSummary[];
  isolatedNodes: NetworkNodeSummary[];
  topLinksByAbsoluteValue: NetworkLinkSummary[];
  topPositiveLinks: NetworkLinkSummary[];
  topNegativeLinks: NetworkLinkSummary[];
  groups: NetworkGroupSummary[];
  grouping: NetworkSummaryGrouping;
  createdAt: string;
};

export type NetworkSummaryComputeOptions = {
  includeDiagonal: boolean;
  includeZeroEdges: boolean;
  topItemsLimit: number;
};
