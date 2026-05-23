import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeNetworkView,
  setNetworkLayout,
} from "@/store/slices/networkVisualization";
import {
  removeRankingResult,
  setRankingLayout,
} from "@/store/slices/rankings";
import PanelGridLayout from "@/components/layout/PanelGridLayout";
import { useNetworkMatrixCache } from "@/components/network/useNetworkMatrixCache";
import { useComputedNetworkViews } from "@/components/network/useComputedNetworkViews";
import { buildNetworkPanelItems } from "@/components/network/NetworkPanelItems";
import RankingResultsTable from "@/components/rankings/RankingResultsTable";
import { formatRankingPanelTitle } from "@/components/rankings/rankingOptions";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { buildRuntimeMaskLinkSet } from "@/components/network/networkFormatting";
import type { NetworkViewDescriptor } from "@/types/networkVisualization";
import type { PanelItem } from "@/types/layout";

function NetworkVisualizationSelector() {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlas = useAppSelector((state) => state.atlas);
  const uiRangeMode = useAppSelector(
    (state) => state.visualizationUi.uiRangeMode,
  );
  const networkState = useAppSelector((state) => state.networkVisualization);
  const rankingState = useAppSelector((state) => state.rankings);

  const views = useMemo(
    () =>
      networkState.viewsOrder
        .map((id) => networkState.viewsById[id])
        .filter((view): view is NetworkViewDescriptor => Boolean(view)),
    [networkState.viewsById, networkState.viewsOrder],
  );

  const { matrixByCompoundId, loadingCompoundIds } =
    useNetworkMatrixCache(views);

  const { matrixOrderIds, activeLabelIds } = useAtlasLabelPresentation();
  const { activeLabelIds: matrixActiveLabelIds } = useAtlasLabelPresentation({
    useMatrixHierarchyOrder: true,
  });

  const {
    computedByViewId,
    visibilityByViewId,
    nodeFilterContributors,
    linkFilterContributors,
  } = useComputedNetworkViews({
    views,
    matrixByCompoundId,
    matrixSettingsByViewId: networkState.matrixSettingsByViewId,
    nodeLinkSettingsByViewId: networkState.nodeLinkSettingsByViewId,
    matrixOrderIds,
    atlasOrderLength: atlas.order.length,
    activeLabelIds,
    matrixActiveLabelIds,
    circularHierarchyCategoryOrder: atlas.circularHierarchyCategoryOrder,
    matrixHierarchyCategoryOrder: atlas.matrixHierarchyCategoryOrder,
    dataset,
    uiRangeMode,
  });

  const runtimeAllowedLinkIds = useMemo(
    () =>
      buildRuntimeMaskLinkSet(
        networkState.activeEdgeMask,
        matrixOrderIds.length > 0 ? matrixOrderIds : activeLabelIds,
      ),
    [activeLabelIds, matrixOrderIds, networkState.activeEdgeMask],
  );
  const runtimeAggregatedAllowedLinkIds = useMemo(
    () =>
      buildRuntimeMaskLinkSet(
        networkState.activeAggregatedEdgeMask,
        networkState.activeAggregatedEdgeMask
          ? Object.values(dataset?.connectivity?.matrixIndex ?? {}).find(
              (matrix) =>
                matrix.kind === "reduced" &&
                matrix.geometry.roiOrder?.length ===
                  networkState.activeAggregatedEdgeMask?.values.length,
            )?.geometry.roiOrder ?? []
          : [],
      ),
    [dataset?.connectivity?.matrixIndex, networkState.activeAggregatedEdgeMask],
  );

  const networkPanelItems = useMemo(
    () =>
      buildNetworkPanelItems({
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
      }),
    [
      computedByViewId,
      dataset,
      linkFilterContributors,
      loadingCompoundIds,
      matrixByCompoundId,
      nodeFilterContributors,
      runtimeAllowedLinkIds,
      runtimeAggregatedAllowedLinkIds,
      views,
      visibilityByViewId,
    ],
  );

  const rankingPanelItems = useMemo<PanelItem[]>(
    () =>
      rankingState.resultsOrder
        .map((id) => rankingState.resultsById[id])
        .filter(Boolean)
        .map((result) => ({
          id: result.id,
          title: formatRankingPanelTitle(result, dataset?.connectivity),
          className: "ranking-panel-card",
          content: <RankingResultsTable result={result} />,
        })),
    [dataset?.connectivity, rankingState.resultsById, rankingState.resultsOrder],
  );

  const panelItems = useMemo(
    () => [...networkPanelItems, ...rankingPanelItems],
    [networkPanelItems, rankingPanelItems],
  );

  const combinedLayout = useMemo(
    () => [...networkState.layout, ...rankingState.layout],
    [networkState.layout, rankingState.layout],
  );

  return (
    <PanelGridLayout
      items={panelItems}
      layout={combinedLayout}
      onRemove={(id) => {
        if (networkState.viewsById[id]) {
          dispatch(removeNetworkView({ viewId: id }));
          return;
        }
        dispatch(removeRankingResult({ resultId: id }));
      }}
      setLayout={(nextLayout) => {
        const networkIds = new Set(networkState.viewsOrder);
        const rankingIds = new Set(rankingState.resultsOrder);
        const nextNetworkLayout = nextLayout.filter((entry) =>
          networkIds.has(entry.i),
        );
        const nextRankingLayout = nextLayout.filter((entry) =>
          rankingIds.has(entry.i),
        );
        dispatch(
          setNetworkLayout(
            nextNetworkLayout.map(({ i, x, y, w, h }) => ({
              i,
              x,
              y,
              w,
              h,
            })),
          ),
        );
        dispatch(
          setRankingLayout(
            nextRankingLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
          ),
        );
      }}
    />
  );
}

export default NetworkVisualizationSelector;
