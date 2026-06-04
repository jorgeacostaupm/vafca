import {
  buildRuntimeMaskLinkSet,
  intersectAllowedSets,
} from "@/components/network/networkFormatting";
import type { DatasetMeta } from "@/types/datasetState";
import type { RuntimeEdgeMask } from "@/types/edgeFilter";

export const buildRuntimeAllowedLinkIds = ({
  mask,
  matrixOrderIds,
  activeLabelIds,
}: {
  mask: RuntimeEdgeMask | null;
  matrixOrderIds: string[];
  activeLabelIds: string[];
}) =>
  buildRuntimeMaskLinkSet(
    mask,
    matrixOrderIds.length > 0 ? matrixOrderIds : activeLabelIds,
  );

export const buildRuntimeAggregatedAllowedLinkIds = ({
  mask,
  dataset,
}: {
  mask: RuntimeEdgeMask | null;
  dataset: DatasetMeta | null;
}) =>
  buildRuntimeMaskLinkSet(
    mask,
    mask
      ? Object.values(dataset?.content?.matrixIndex ?? {}).find(
          (matrix) =>
            matrix.kind === "aggregated" &&
            matrix.geometry.roiOrder?.length === mask.values.length,
        )?.geometry.roiOrder ?? []
      : [],
  );

export const combineAllowedLinkIds = (
  crossViewAllowedLinkIds: Set<string> | null,
  runtimeAllowedLinkIds: Set<string> | null,
) => intersectAllowedSets(crossViewAllowedLinkIds, runtimeAllowedLinkIds);
