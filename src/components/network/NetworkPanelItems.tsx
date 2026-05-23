import { createRef, type RefObject } from "react";
import { buildNetworkPanelItem } from "@/components/network/panels/buildNetworkPanelItem";
import { buildComparableMatrixLegendRanges } from "@/components/network/panels/matrixLegendRanges";
import {
  LoadingPanelBody,
  NetworkPanelReloadButton,
} from "@/components/network/panels/NetworkPanelCommon";
import type { PanelItem } from "@/types/layout";
import type {
  ComputedView,
  FilterContributor,
  NetworkViewDescriptor,
  ViewVisibility,
} from "@/types/networkVisualization";
import type { RootState } from "@/types/store";

type BuildNetworkPanelItemsArgs = {
  views: NetworkViewDescriptor[];
  matrixByCompoundId: Record<
    string,
    | Exclude<
        Awaited<ReturnType<typeof import("@/utils/matrixStore").getMatrix>>,
        undefined
      >
    | null
  >;
  loadingCompoundIds: Set<string>;
  computedByViewId: Record<string, ComputedView>;
  dataset: RootState["dataset"]["data"];
  visibilityByViewId: Record<string, ViewVisibility>;
  nodeFilterContributors: FilterContributor[];
  linkFilterContributors: FilterContributor[];
  runtimeAllowedLinkIds: Set<string> | null;
  runtimeAggregatedAllowedLinkIds: Set<string> | null;
};

export const buildNetworkPanelItems = ({
  views,
  matrixByCompoundId,
  loadingCompoundIds,
  computedByViewId,
  dataset,
  visibilityByViewId,
  nodeFilterContributors,
  linkFilterContributors,
  runtimeAllowedLinkIds,
  runtimeAggregatedAllowedLinkIds,
}: BuildNetworkPanelItemsArgs): PanelItem[] => {
  const matrixLegendRangesByViewId = buildComparableMatrixLegendRanges({
    views,
    matrixByCompoundId,
    computedByViewId,
    dataset,
  });

  return views.map((view) => {
    const svgRef = createRef<SVGSVGElement>() as RefObject<SVGSVGElement>;
    const matrixRecord = matrixByCompoundId[view.compoundId];
    const isLoadingMatrix =
      loadingCompoundIds.has(view.compoundId) ||
      typeof matrixRecord === "undefined";
    const computed = computedByViewId[view.id];

    if (isLoadingMatrix || !computed || !matrixRecord) {
      return {
        id: view.id,
        title: view.label,
        actions: <NetworkPanelReloadButton viewId={view.id} />,
        content: <LoadingPanelBody text="Loading matrix…" />,
      };
    }

    const common = {
      computed,
      svgRef,
      matrixRecord,
      dataset,
      visibilityByViewId,
      nodeFilterContributors,
      linkFilterContributors,
      runtimeAllowedLinkIds,
      runtimeAggregatedAllowedLinkIds,
      matrixLegendRange: matrixLegendRangesByViewId[view.id],
    };

    const built = buildNetworkPanelItem(common);

    return built;
  });
};
