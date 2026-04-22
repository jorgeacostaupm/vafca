import { useCallback, useMemo } from "react";
import { Col, Row, Typography } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useMatrixSummaries } from "@/hooks/useMatrixSummaries";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import {
  addNetworkLayoutItem,
  addNetworkView,
  markNetworkViewFormatting,
  removeNetworkView,
  setNetworkLayout,
} from "@/store/slices/networkVisualizationSlice";
import { useMatrixFilterOptions } from "@/components/selectors/useMatrixFilterOptions";
import {
  buildDefaultRanges,
  buildMatrixLabel,
} from "@/utils/matrixViewUtils";
import PanelGridLayout from "@/components/layout/PanelGridLayout";
import { buildAtlasRoiColorById } from "@/utils/atlas/coloring";
import { useNetworkMatrixCache } from "@/components/network/useNetworkMatrixCache";
import { useNetworkViewLifecycle } from "@/components/network/useNetworkViewLifecycle";
import { useComputedNetworkViews } from "@/components/network/useComputedNetworkViews";
import { buildNetworkPanelItems } from "@/components/network/NetworkPanelItems";
import NetworkSelectorSidebar from "@/components/network/NetworkSelectorSidebar";
import type { NetworkViewDescriptor } from "@/types/networkVisualization";

function NetworkVisualizationSelector() {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlas = useAppSelector((state) => state.atlas);
  const matrixShape = useAppSelector(
    (state) => state.visualizationUi.matrixShape,
  );
  const networkState = useAppSelector((state) => state.networkVisualization);

  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );
  const { summaries, status, error } = useMatrixSummaries(
    dataset?.matrixStats.total,
  );

  const views = useMemo(
    () =>
      networkState.viewsOrder
        .map((id) => networkState.viewsById[id])
        .filter((view): view is NetworkViewDescriptor => Boolean(view)),
    [networkState.viewsById, networkState.viewsOrder],
  );

  const { matrixByCompoundId, loadingCompoundIds } =
    useNetworkMatrixCache(views);

  const {
    matrixOrderIds,
    labelNames,
    activeLabelIds,
    populationOptions,
    measures,
    statOptions,
    bandOptions,
    matches,
    matrixOptions,
  } = useMatrixFilterOptions({
    dataset,
    atlas,
    summaries,
    populationKey: networkState.controls.populationKey,
    measureId: networkState.controls.measureId,
    statId: networkState.controls.statId,
    bandId: networkState.controls.bandId,
  });

  const defaultMeasureRanges = useMemo(
    () => buildDefaultRanges(dataset?.catalogs.measures),
    [dataset],
  );

  const nodeColors = useMemo(
    () =>
      buildAtlasRoiColorById({
        atlasDefinition,
        colorFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      }),
    [atlas.colorFields, atlas.colorPalette, atlasDefinition],
  );
  const labelTitles = useMemo(
    () =>
      atlas.order.reduce<Record<string, string>>((acc, id) => {
        const meta = atlas.labelsById[id];
        if (!meta) return acc;
        acc[id] = meta.label ?? id;
        return acc;
      }, {}),
    [atlas.order, atlas.labelsById],
  );
  const labelAcronyms = useMemo(
    () =>
      atlas.order.reduce<Record<string, string>>((acc, id) => {
        const meta = atlas.labelsById[id];
        if (!meta) return acc;
        acc[id] = meta.acronym?.trim() ? meta.acronym : id;
        return acc;
      }, {}),
    [atlas.order, atlas.labelsById],
  );

  useNetworkViewLifecycle({
    dispatch,
    matches,
    summariesStatus: status,
    selectedCompoundId: networkState.controls.selectedCompoundId,
    summaries,
    views,
    loadingCompoundIds,
    matrixByCompoundId,
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
    matrixShape,
    defaultMeasureRanges,
  });

  const zoomTargetsByType = useCallback(
    (viewId: string) => {
      if (!networkState.controls.syncZoom) return [viewId];
      const trigger = networkState.viewsById[viewId];
      if (!trigger) return [viewId];
      const isMatrix = trigger.type === "matrix";
      return views
        .filter((view) =>
          isMatrix ? view.type === "matrix" : view.type !== "matrix",
        )
        .map((view) => view.id);
    },
    [networkState.controls.syncZoom, networkState.viewsById, views],
  );

  const handleAddView = useCallback(() => {
    if (!networkState.controls.selectedCompoundId) return;
    const summary = matches.find(
      (item) => item.compoundId === networkState.controls.selectedCompoundId,
    );
    if (!summary) return;

    const viewId = `${summary.compoundId}::${networkState.nextViewSeq}`;
    dispatch(
      addNetworkView({
        type: networkState.controls.viewType,
        compoundId: summary.compoundId,
        label: buildMatrixLabel(summary, dataset?.catalogs),
        measureId: summary.measureId,
        statId: summary.statId,
      }),
    );
    dispatch(
      addNetworkLayoutItem({
        viewId,
        defaultW: 8,
        defaultH: 5,
        columns: 3,
      }),
    );
  }, [
    dataset,
    dispatch,
    matches,
    networkState.controls.selectedCompoundId,
    networkState.controls.viewType,
    networkState.nextViewSeq,
  ]);

  const panelItems = useMemo(
    () =>
      buildNetworkPanelItems({
        views,
        matrixByCompoundId,
        loadingCompoundIds,
        computedByViewId,
        dataset,
        matrixShape,
        labelNames,
        labelTitles,
        labelAcronyms,
        nodeColors,
        visibilityByViewId,
        nodeFilterContributors,
        linkFilterContributors,
        zoomTargetsByType,
        dispatch,
        markFormatting: markNetworkViewFormatting,
      }),
    [
      computedByViewId,
      dataset,
      dispatch,
      labelAcronyms,
      labelNames,
      labelTitles,
      linkFilterContributors,
      loadingCompoundIds,
      matrixByCompoundId,
      matrixShape,
      nodeColors,
      nodeFilterContributors,
      views,
      visibilityByViewId,
      zoomTargetsByType,
    ],
  );

  if (status === "loading") {
    return <Typography.Text>Loading matrix list…</Typography.Text>;
  }

  if (status === "error") {
    return <Typography.Text type="danger">Error: {error}</Typography.Text>;
  }

  return (
    <Row gutter={[16, 16]}>
      <NetworkSelectorSidebar
        dispatch={dispatch}
        controls={networkState.controls}
        measures={measures}
        populations={populationOptions}
        bands={bandOptions}
        stats={statOptions}
        matrices={matrixOptions}
        showMatrixSelect={matches.length > 1}
        onAdd={handleAddView}
      />

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
