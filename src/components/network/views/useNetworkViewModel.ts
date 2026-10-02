import { useMemo, useRef } from "react";

import { resolveAllowedSet } from "@/components/network/networkFormatting";
import { useNetworkViewComputationContext } from "@/components/network/views/networkViewComputationContext";
import {
  buildNetworkViewRenderData,
} from "@/components/network/views/networkViewData";
import {
  buildRuntimeAllowedLinkIds,
  combineAllowedLinkIds,
} from "@/components/network/views/networkViewMasks";
import { buildNetworkViewValueFilters } from "@/components/network/views/networkViewVisibility";
import {
  resolveNetworkViewWithContext,
} from "@/components/network/views/useNetworkViewResolver";
import { useNetworkViewSourceFilters } from "@/components/network/views/useNetworkViewSourceFilters";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { useAppSelector } from "@/store/hooks";
import { selectMaterializedNetworkByCompoundId } from "@/store/slices/dataset/datasetSelectors";
import { selectNetworkViewWithCurrentLabel } from "@/store/slices/networkVisualization/networkVisualizationSelectors";
import { selectSharedMatrixDomains } from "@/store/slices/networkVisualization/sharedMatrixDomainSelectors";
import type { MaterializedNetworkView } from "@/types/datasetNetworkView";
import { buildAggregatedNodeColors, shortenAggregatedNodeLabels } from "@/utils/aggregatedNodePresentation";

export const useNetworkViewModel = (viewId: string) => {
  const { nodeColors } = useAtlasLabelPresentation();
  const svgRef = useRef<SVGSVGElement>(null);
  const view = useAppSelector(
    (state) => selectNetworkViewWithCurrentLabel(state, viewId),
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
  const context = useNetworkViewComputationContext();
  const sharedColorDomain = useAppSelector(state => selectSharedMatrixDomains(state)[viewId]);
  const compoundId = view?.compoundId;
  const temporaryNetwork = useAppSelector((state) =>
    view?.temporaryNetworkId
      ? state.networkVisualization.temporaryNetworksById[view.temporaryNetworkId] ?? null
      : null,
  );
  const datasetNetworkView = useAppSelector(state =>
    temporaryNetwork ? null : selectMaterializedNetworkByCompoundId(state, compoundId),
  );
  const networkView = useMemo<MaterializedNetworkView | null>(() => {
    if (!temporaryNetwork) return datasetNetworkView;
    return {
      id: temporaryNetwork.id,
      compoundId: temporaryNetwork.id,
      sourceId: "temporary",
      measureId: temporaryNetwork.measureId,
      statisticId: temporaryNetwork.statisticId,
      dimensions: {},
      nodeIds: temporaryNetwork.rowLabels,
      data: temporaryNetwork.data,
      symmetric: temporaryNetwork.symmetric,
      dataStats: temporaryNetwork.dataStats,
    };
  }, [datasetNetworkView, temporaryNetwork]);
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
  const isTemporaryNetwork = Boolean(temporaryNetwork);
  const isAggregatedNetwork =
    isTemporaryNetwork || sourceNetwork?.derivation?.type === "aggregation";
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
      ? null
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
    const groups = temporaryNetwork?.groups ?? (sourceNetwork?.derivation?.type === 'aggregation' ? sourceNetwork.derivation.groups : []);
    const viewColors = isAggregatedNetwork ? buildAggregatedNodeColors(groups) : nodeColors;
    return {
      kind: "ready" as const,
      view,
      computed: {
        ...computed,
        valueDomain: sharedColorDomain ?? computed.valueDomain,
        labelNames: temporaryNetwork ? shortenAggregatedNodeLabels(temporaryNetwork.labelNames) : undefined,
        labelTitles: temporaryNetwork?.labelTitles,
        labelAcronyms: temporaryNetwork?.labelAcronyms,
        nodeColors: viewColors,
      },
      renderData,
      networkView,
      svgRef,
      valueFilters,
      isMatrixView: view.type === "matrix",
      isAggregatedNetwork,
      isTemporaryNetwork,
      className: computed.isRangeFilterSource
        ? "network-view-card--range-filter-source"
        : undefined,
    };
  }, [
    activeEdgeMask,
    sourceNetwork,
    sharedColorDomain,
    computed,
    context,
    isAggregatedNetwork,
    isTemporaryNetwork,
    networkView,
    nodeColors,
    sourceFilters,
    svgRef,
    temporaryNetwork,
    view,
    viewId,
  ]);
};
