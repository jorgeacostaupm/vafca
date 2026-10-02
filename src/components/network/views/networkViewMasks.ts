import {
  buildRuntimeMaskLinkSet,
  intersectAllowedSets,
} from "@/components/network/networkFormatting";
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

export const combineAllowedLinkIds = (
  crossViewAllowedLinkIds: Set<string> | null,
  runtimeAllowedLinkIds: Set<string> | null,
) => intersectAllowedSets(crossViewAllowedLinkIds, runtimeAllowedLinkIds);
