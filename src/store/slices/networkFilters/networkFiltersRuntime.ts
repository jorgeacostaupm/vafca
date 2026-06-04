import type { UiRangeMode } from "@/types/connectivityBundle";
import type { DatasetMeta } from "@/types/datasetState";
import type {
  MatrixFilterDefinition,
  MatrixFilterValidationResult,
  NetworkEdgeDomain,
} from "@/types/edgeFilter";
import { getDatasetMatrixOrder } from "@/utils/datasetAccessors";
import {
  buildAggregatedEdgeDomain,
  buildNetworkEdgeDomain,
  createRuntimeEdgeMask,
  normalizeMatrixFilterDefinitionForRanges,
  validateMatrixFilterDefinition,
} from "@/utils/edgeFilter";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";

import type {
  NetworkEdgeFilterMode,
  NetworkFilterRuntime,
} from "./networkFiltersTypes";

const createMissingDomainValidation = (): MatrixFilterValidationResult => ({
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

  const matrixOrderIds = normalizeMatrixOrder(getDatasetMatrixOrder(dataset)).map(
    (item) => item.id,
  );
  return buildNetworkEdgeDomain(dataset, matrixOrderIds);
};

export const resolveNetworkFilterRuntime = ({
  mode,
  definition,
  dataset,
  uiRangeMode,
}: {
  mode: NetworkEdgeFilterMode;
  definition: MatrixFilterDefinition;
  dataset: DatasetMeta | null;
  uiRangeMode: UiRangeMode;
}): NetworkFilterRuntime => {
  const content = dataset?.content;
  const matrixIndex = content?.matrixIndex ?? {};
  const edgeDomain = resolveNetworkFilterEdgeDomain(mode, dataset);
  const normalizedFilter = normalizeMatrixFilterDefinitionForRanges(
    definition,
    matrixIndex,
    content?.catalogs,
    uiRangeMode,
  );
  const validation = edgeDomain
    ? validateMatrixFilterDefinition(normalizedFilter, matrixIndex, edgeDomain)
    : createMissingDomainValidation();

  return {
    edgeDomain,
    normalizedFilter,
    validation,
    mask:
      edgeDomain && validation.valid
        ? createRuntimeEdgeMask(normalizedFilter, matrixIndex, edgeDomain)
        : null,
  };
};
