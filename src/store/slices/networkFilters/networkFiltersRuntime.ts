import type { DatasetMeta } from "@/types/datasetState";
import type {
  NetworkEdgeDomain,
  NetworkFilterDefinition,
  NetworkFilterValidationResult,
} from "@/types/edgeFilter";
import type { UiRangeMode } from "@/types/network";
import { getDatasetNodeOrder } from "@/utils/datasetAccessors";
import {
  buildAggregatedEdgeDomain,
  buildNetworkEdgeDomain,
  createRuntimeEdgeMask,
  normalizeNetworkFilterDefinitionForRanges,
  validateNetworkFilterDefinition,
} from "@/utils/edgeFilter";
import { normalizeNodeOrder } from "@/utils/nodeOrder";

import type {
  NetworkEdgeFilterMode,
  NetworkFilterRuntime,
} from "./networkFiltersTypes";

const createMissingDomainValidation = (): NetworkFilterValidationResult => ({
  valid: false,
  errors: [
    {
      id: "missing-domain",
      severity: "error",
      message: "The network edge domain is not available.",
    },
  ],
  warnings: [],
});

export const resolveNetworkFilterEdgeDomain = (
  mode: NetworkEdgeFilterMode,
  dataset: DatasetMeta | null,
): NetworkEdgeDomain | null => {
  if (mode === "aggregated") return buildAggregatedEdgeDomain(dataset);

  const nodeOrderIds = normalizeNodeOrder(getDatasetNodeOrder(dataset)).map(
    (item) => item.id,
  );
  return buildNetworkEdgeDomain(dataset, nodeOrderIds);
};

export const resolveNetworkFilterRuntime = ({
  mode,
  definition,
  dataset,
  uiRangeMode,
}: {
  mode: NetworkEdgeFilterMode;
  definition: NetworkFilterDefinition;
  dataset: DatasetMeta | null;
  uiRangeMode: UiRangeMode;
}): NetworkFilterRuntime => {
  const content = dataset?.content;
  const networkIndex = content?.networkIndex ?? {};
  const edgeDomain = resolveNetworkFilterEdgeDomain(mode, dataset);
  const normalizedFilter = normalizeNetworkFilterDefinitionForRanges(
    definition,
    networkIndex,
    content?.catalogs,
    uiRangeMode,
  );
  const validation = edgeDomain
    ? validateNetworkFilterDefinition(normalizedFilter, networkIndex, edgeDomain)
    : createMissingDomainValidation();

  return {
    edgeDomain,
    normalizedFilter,
    validation,
    mask:
      edgeDomain && validation.valid
        ? createRuntimeEdgeMask(normalizedFilter, networkIndex, edgeDomain)
        : null,
  };
};
