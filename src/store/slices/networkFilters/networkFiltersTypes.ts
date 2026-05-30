import type {
  MatrixFilterDefinition,
  MatrixFilterValidationResult,
  NetworkEdgeDomain,
  RuntimeEdgeMask,
} from "@/types/edgeFilter";

export type NetworkEdgeFilterMode = "roi" | "aggregated";

export type NetworkFilterRuntime = {
  edgeDomain: NetworkEdgeDomain | null;
  normalizedFilter: MatrixFilterDefinition;
  validation: MatrixFilterValidationResult;
  mask: RuntimeEdgeMask | null;
};

export type NetworkFiltersState = {
  activeNetworkFilter: MatrixFilterDefinition | null;
  activeEdgeMask: RuntimeEdgeMask | null;
  activeAggregatedNetworkFilter: MatrixFilterDefinition | null;
  activeAggregatedEdgeMask: RuntimeEdgeMask | null;
};

export const initialNetworkFiltersState: NetworkFiltersState = {
  activeNetworkFilter: null,
  activeEdgeMask: null,
  activeAggregatedNetworkFilter: null,
  activeAggregatedEdgeMask: null,
};
