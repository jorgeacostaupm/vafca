import { createSelector } from "@reduxjs/toolkit";
import { useMemo, useRef } from "react";

import { resolveAllowedSet } from "@/components/network/networkFormatting";
import { useNetworkViewComputationContext } from "@/components/network/views/networkViewComputationContext";
import {
  buildNetworkViewRenderData,
} from "@/components/network/views/networkViewData";
import {
  buildRuntimeAggregatedAllowedLinkIds,
  buildRuntimeAllowedLinkIds,
  combineAllowedLinkIds,
} from "@/components/network/views/networkViewMasks";
import { buildNetworkViewValueFilters } from "@/components/network/views/networkViewVisibility";
import {
  resolveNetworkViewWithContext,
} from "@/components/network/views/useNetworkViewResolver";
import { useNetworkViewSourceFilters } from "@/components/network/views/useNetworkViewSourceFilters";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  getDatasetCatalogs,
  getMaterializedNetworkByCompoundId,
} from "@/utils/datasetAccessors";
import { resolveValueDomain } from "@/utils/valueDomain";

export const useNetworkViewModel = (viewId: string) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const view = useAppSelector(
    (state) => state.networkVisualization.viewsById[viewId],
  );
  const matrixSettings = useAppSelector(
    (state) => state.networkVisualization.matrixSettingsByViewId[viewId],
  );
  const nodeLinkSettings = useAppSelector(
    (state) => state.networkVisualization.nodeLinkSettingsByViewId[viewId],
  );
  const activeEdgeMask = useAppSelector(
    (state) => state.networkFilters.activeEdgeMask,
  );
  const activeAggregatedEdgeMask = useAppSelector(
    (state) => state.networkFilters.activeAggregatedEdgeMask,
  );
  const context = useNetworkViewComputationContext();
  const compoundId = view?.compoundId;
  const selectNetworkView = useMemo(
    () =>
      createSelector([selectDatasetData], (dataset) =>
        compoundId ? getMaterializedNetworkByCompoundId(dataset, compoundId) ?? null : null,
      ),
    [compoundId],
  );
  const networkView = useAppSelector(selectNetworkView);
  const settings = view?.type === "matrix" ? matrixSettings : nodeLinkSettings;
  const computed = useMemo(
    () =>
      view && networkView
        ? resolveNetworkViewWithContext({
            view,
            networkView,
            settings,
            nodeLinkSettings:
              view.type === "matrix" ? undefined : nodeLinkSettings,
            context,
          })
        : null,
    [context, networkView, nodeLinkSettings, settings, view],
  );
  const sourceNetwork = networkView
    ? context.dataset?.content?.networkIndex[networkView.id]
    : undefined;
  const isAggregatedNetwork = sourceNetwork?.derivation?.type === "aggregation";
  const targetIsFilterSource = Boolean(
    computed?.useAsNodeFilter || computed?.useAsLinkFilter,
  );
  const sourceFilters = useNetworkViewSourceFilters({
    targetViewId: viewId,
    targetIsAggregated: Boolean(isAggregatedNetwork),
    targetIsFilterSource,
    context,
  });

  return useMemo(() => {
    if (!view) return { kind: "missing" as const, viewId };
    if (!networkView || !computed) {
      return { kind: "loading" as const, view, svgRef };
    }

    const valueFilters = buildNetworkViewValueFilters(computed);
    const allowedNodeIds = resolveAllowedSet(
      sourceFilters.nodeFilterContributors,
      view.id,
      "nodeIds",
      sourceFilters.visibilityByViewId,
    );
    const crossViewAllowedLinkIds = resolveAllowedSet(
      sourceFilters.linkFilterContributors,
      view.id,
      "linkIds",
      sourceFilters.visibilityByViewId,
    );
    const runtimeAllowedLinkIds = isAggregatedNetwork
      ? buildRuntimeAggregatedAllowedLinkIds({
          mask: activeAggregatedEdgeMask,
          dataset: context.dataset,
        })
      : buildRuntimeAllowedLinkIds({
          mask: activeEdgeMask,
          nodeOrderIds: context.nodeOrderIds,
          activeLabelIds: context.activeLabelIds,
        });
    const allowedLinkIds = combineAllowedLinkIds(
      crossViewAllowedLinkIds,
      runtimeAllowedLinkIds,
    );
    const renderData = buildNetworkViewRenderData({
      viewType: view.type,
      computed,
      valueFilters,
      allowedNodeIds,
      allowedLinkIds,
    });
    const renderedData = renderData.payload.data;
    const valueDomain = resolveValueDomain({
      network: sourceNetwork ?? networkView,
      catalogs: getDatasetCatalogs(context.dataset),
      mode: context.uiRangeMode,
      observedData: renderedData,
    });
    return {
      kind: "ready" as const,
      view,
      computed: {
        ...computed,
        valueDomain,
      },
      renderData,
      networkView,
      svgRef,
      valueFilters,
      isMatrixView: view.type === "matrix",
      className: computed.isRangeFilterSource
        ? "network-view-card--range-filter-source"
        : undefined,
    };
  }, [
    activeAggregatedEdgeMask,
    activeEdgeMask,
    computed,
    context,
    isAggregatedNetwork,
    networkView,
    sourceNetwork,
    sourceFilters,
    svgRef,
    view,
    viewId,
  ]);
};
