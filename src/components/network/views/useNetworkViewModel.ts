import { useMemo, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { resolveAllowedSet } from "@/components/network/networkFormatting";
import {
  buildAdaptedNetworkViewData,
} from "@/components/network/views/networkViewData";
import { buildComparableMatrixLegendRange } from "@/components/network/views/networkViewLegend";
import { buildNetworkViewValueFilters } from "@/components/network/views/networkViewVisibility";
import {
  buildRuntimeAggregatedAllowedLinkIds,
  buildRuntimeAllowedLinkIds,
  combineAllowedLinkIds,
} from "@/components/network/views/networkViewMasks";
import {
  useNetworkViewResolver,
  useNetworkViews,
} from "@/components/network/views/useNetworkViewResolver";
import { useNetworkViewSourceFilters } from "@/components/network/views/useNetworkViewSourceFilters";
import { getDatasetMatrixByCompoundId } from "@/utils/datasetAccessors";

export const useNetworkViewModel = (viewId: string) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const views = useNetworkViews();
  const view = useAppSelector(
    (state) => state.networkVisualization.viewsById[viewId],
  );
  const activeEdgeMask = useAppSelector(
    (state) => state.networkFilters.activeEdgeMask,
  );
  const activeAggregatedEdgeMask = useAppSelector(
    (state) => state.networkFilters.activeAggregatedEdgeMask,
  );
  const resolver = useNetworkViewResolver();
  const matrixRecord = view
    ? getDatasetMatrixByCompoundId(resolver.dataset, view.compoundId)
    : null;
  const computed = view ? resolver.resolve(view) : null;
  const sourceMatrix = matrixRecord
    ? resolver.dataset?.content?.matrixIndex[matrixRecord.id]
    : undefined;
  const isReducedMatrix = sourceMatrix?.kind === "reduced";
  const targetIsFilterSource = Boolean(
    computed?.useAsNodeFilter || computed?.useAsLinkFilter,
  );
  const sourceFilters = useNetworkViewSourceFilters({
    targetViewId: viewId,
    targetIsReduced: Boolean(isReducedMatrix),
    targetIsFilterSource,
    views,
    resolveView: resolver.resolve,
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
    const runtimeAllowedLinkIds = isReducedMatrix
      ? buildRuntimeAggregatedAllowedLinkIds({
          mask: activeAggregatedEdgeMask,
          dataset: resolver.dataset,
        })
      : buildRuntimeAllowedLinkIds({
          mask: activeEdgeMask,
          matrixOrderIds: resolver.matrixOrderIds,
          activeLabelIds: resolver.activeLabelIds,
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
    const matrixByCompoundId = Object.fromEntries(
      views.map((item) => [
        item.compoundId,
        getDatasetMatrixByCompoundId(resolver.dataset, item.compoundId) ?? null,
      ]),
    );

    return {
      kind: "ready" as const,
      view,
      computed,
      adapted,
      matrixRecord,
      svgRef,
      valueFilters,
      isMatrixView: view.type === "matrix",
      className: computed.isRangeFilterSource
        ? "network-view-card--range-filter-source"
        : undefined,
      matrixLegendRange: buildComparableMatrixLegendRange({
        view,
        views,
        matrixByCompoundId,
        dataset: resolver.dataset,
        uiRangeMode: resolver.uiRangeMode,
      }),
    };
  }, [
    activeAggregatedEdgeMask,
    activeEdgeMask,
    computed,
    isReducedMatrix,
    matrixRecord,
    resolver,
    sourceFilters,
    svgRef,
    view,
    viewId,
    views,
  ]);
};
