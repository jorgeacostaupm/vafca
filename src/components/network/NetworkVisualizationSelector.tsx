import { useMemo } from "react";
import { Col, Row } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeNetworkView,
  setNetworkLayout,
} from "@/store/slices/networkVisualization";
import { buildDefaultRanges } from "@/utils/matrixViewUtils";
import PanelGridLayout from "@/components/layout/PanelGridLayout";
import { useNetworkMatrixCache } from "@/components/network/useNetworkMatrixCache";
import { useComputedNetworkViews } from "@/components/network/useComputedNetworkViews";
import { buildNetworkPanelItems } from "@/components/network/NetworkPanelItems";
import NetworkSelectorSidebar from "@/components/network/NetworkSelectorSidebar";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import type { NetworkViewDescriptor } from "@/types/networkVisualization";

function NetworkVisualizationSelector() {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlas = useAppSelector((state) => state.atlas);
  const matrixShape = useAppSelector(
    (state) => state.visualizationUi.matrixShape,
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

  const defaultMeasureRanges = useMemo(
    () => buildDefaultRanges(dataset?.catalogs.measures),
    [dataset],
  );

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
    matrixShape,
    defaultMeasureRanges,
  });

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
      }),
    [
      computedByViewId,
      dataset,
      linkFilterContributors,
      loadingCompoundIds,
      matrixByCompoundId,
      nodeFilterContributors,
      views,
      visibilityByViewId,
    ],
  );

  return (
    <Row gutter={[16, 16]}>
      <NetworkSelectorSidebar />

      <Col xs={24} lg={20}>
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
      </Col>
    </Row>
  );
}

export default NetworkVisualizationSelector;
