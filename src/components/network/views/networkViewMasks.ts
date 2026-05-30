import {
  buildRuntimeMaskLinkSet,
  intersectAllowedSets,
} from "@/components/network/networkFormatting";
import type { RuntimeEdgeMask } from "@/types/edgeFilter";
import type { DatasetMeta } from "@/types/datasetState";

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
            matrix.kind === "reduced" &&
            matrix.geometry.roiOrder?.length === mask.values.length,
        )?.geometry.roiOrder ?? []
      : [],
  );

export const combineAllowedLinkIds = (
  crossViewAllowedLinkIds: Set<string> | null,
  runtimeAllowedLinkIds: Set<string> | null,
) => intersectAllowedSets(crossViewAllowedLinkIds, runtimeAllowedLinkIds);
