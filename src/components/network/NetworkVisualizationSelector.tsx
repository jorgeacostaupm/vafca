import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeNetworkView,
  setNetworkLayout,
} from "@/store/slices/networkVisualization";
import PanelGridLayout from "@/components/layout/PanelGridLayout";
import { useNetworkMatrixCache } from "@/components/network/useNetworkMatrixCache";
import { useComputedNetworkViews } from "@/components/network/useComputedNetworkViews";
import { buildNetworkPanelItems } from "@/components/network/NetworkPanelItems";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { buildRuntimeMaskLinkSet } from "@/components/network/networkFormatting";
import type { NetworkViewDescriptor } from "@/types/networkVisualization";

function NetworkVisualizationSelector() {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlas = useAppSelector((state) => state.atlas);
  const uiRangeMode = useAppSelector(
    (state) => state.visualizationUi.uiRangeMode,
  );
  const includeDiagonalInRanges = useAppSelector(
    (state) => state.visualizationUi.includeDiagonalInRanges,
  );
  const networkState = useAppSelector((state) => state.networkVisualization);

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
    includeDiagonalInRanges,
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

  const panelItems = useMemo(
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

  return (
    <PanelGridLayout
      items={panelItems}
      layout={networkState.layout}
      onRemove={(viewId) => dispatch(removeNetworkView({ viewId }))}
      setLayout={(nextLayout) =>
        dispatch(
          setNetworkLayout(
            nextLayout.map(({ i, x, y, w, h }) => ({
              i,
              x,
              y,
              w,
              h,
            })),
          ),
        )
      }
    />
  );
}

export default NetworkVisualizationSelector;
