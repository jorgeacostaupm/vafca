import { useMemo, useRef } from "react";

import { resolveAllowedSet } from "@/components/network/networkFormatting";
import { useNetworkViewComputationContext } from "@/components/network/views/networkViewComputationContext";
import {
  buildAdaptedNetworkViewData,
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
import { getDatasetCatalogs } from "@/utils/datasetAccessors";
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
  const matrixRecord = useMemo(
    () => (view ? context.matrixByCompoundId[view.compoundId] ?? null : null),
    [context.matrixByCompoundId, view],
  );
  const settings = view?.type === "matrix" ? matrixSettings : nodeLinkSettings;
  const computed = useMemo(
    () =>
      view && matrixRecord
        ? resolveNetworkViewWithContext({
            view,
            matrix: matrixRecord,
            settings,
            nodeLinkSettings:
              view.type === "matrix" ? undefined : nodeLinkSettings,
            context,
          })
        : null,
    [context, matrixRecord, nodeLinkSettings, settings, view],
  );
  const sourceMatrix = matrixRecord
    ? context.dataset?.content?.matrixIndex[matrixRecord.id]
    : undefined;
  const isAggregatedMatrix = sourceMatrix?.kind === "aggregated";
  const targetIsFilterSource = Boolean(
    computed?.useAsNodeFilter || computed?.useAsLinkFilter,
  );
  const sourceFilters = useNetworkViewSourceFilters({
    targetViewId: viewId,
    targetIsAggregated: Boolean(isAggregatedMatrix),
    targetIsFilterSource,
    context,
  });

  return useMemo(() => {
    if (!view) return { kind: "missing" as const, viewId };
    if (!matrixRecord || !computed) {
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
    const runtimeAllowedLinkIds = isAggregatedMatrix
      ? buildRuntimeAggregatedAllowedLinkIds({
          mask: activeAggregatedEdgeMask,
          dataset: context.dataset,
        })
      : buildRuntimeAllowedLinkIds({
          mask: activeEdgeMask,
          matrixOrderIds: context.matrixOrderIds,
          activeLabelIds: context.activeLabelIds,
        });
    const allowedLinkIds = combineAllowedLinkIds(
      crossViewAllowedLinkIds,
      runtimeAllowedLinkIds,
    );
    const adapted = buildAdaptedNetworkViewData({
      viewType: view.type,
      computed,
      valueFilters,
      allowedNodeIds,
      allowedLinkIds,
    });
    const adaptedData = adapted.payload.data;
    const valueDomain = resolveValueDomain({
      matrix: sourceMatrix ?? matrixRecord,
      catalogs: getDatasetCatalogs(context.dataset),
      mode: context.uiRangeMode,
      observedData: adaptedData,
    });
    return {
      kind: "ready" as const,
      view,
      computed: {
        ...computed,
        valueDomain,
      },
      adapted,
      matrixRecord,
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
    isAggregatedMatrix,
    matrixRecord,
    sourceMatrix,
    sourceFilters,
    svgRef,
    view,
    viewId,
  ]);
};
