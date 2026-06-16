import {
  buildRuntimeMaskLinkSet,
  intersectAllowedSets,
} from "@/components/network/networkFormatting";
import type { DatasetMeta } from "@/types/datasetState";
import type { RuntimeEdgeMask } from "@/types/edgeFilter";

export const buildRuntimeAllowedLinkIds = ({
  mask,
  nodeOrderIds,
  activeLabelIds,
}: {
  mask: RuntimeEdgeMask | null;
  nodeOrderIds: string[];
  activeLabelIds: string[];
}) =>
  buildRuntimeMaskLinkSet(
    mask,
    nodeOrderIds.length > 0 ? nodeOrderIds : activeLabelIds,
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
      ? dataset?.content?.networks.find(
          (network) =>
            network.derivation?.type === "aggregation" &&
            network.nodeIds.length === mask.values.length,
        )?.nodeIds ?? []
      : [],
  );

export const combineAllowedLinkIds = (
  crossViewAllowedLinkIds: Set<string> | null,
  runtimeAllowedLinkIds: Set<string> | null,
) => intersectAllowedSets(crossViewAllowedLinkIds, runtimeAllowedLinkIds);
