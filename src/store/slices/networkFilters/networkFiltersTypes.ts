import type {
  NetworkEdgeDomain,
  NetworkFilterDefinition,
  NetworkFilterValidationResult,
  RuntimeEdgeMask,
} from "@/types/edgeFilter";

export type NetworkEdgeFilterMode = "original" | "aggregated";

export type NetworkFilterRuntime = {
  edgeDomain: NetworkEdgeDomain | null;
  normalizedFilter: NetworkFilterDefinition;
  validation: NetworkFilterValidationResult;
  mask: RuntimeEdgeMask | null;
};

export type NetworkFiltersState = {
  activeNetworkFilter: NetworkFilterDefinition | null;
  activeEdgeMask: RuntimeEdgeMask | null;
  activeAggregatedNetworkFilter: NetworkFilterDefinition | null;
  activeAggregatedEdgeMask: RuntimeEdgeMask | null;
};

export const initialNetworkFiltersState: NetworkFiltersState = {
  activeNetworkFilter: null,
  activeEdgeMask: null,
  activeAggregatedNetworkFilter: null,
  activeAggregatedEdgeMask: null,
};
