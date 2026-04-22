import { Button, Popover, Space } from "antd";
import {
  FilterOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  SelectOutlined,
  ZoomInOutlined,
} from "@ant-design/icons";
import ChartDownloadButton from "@/components/common/ChartDownloadButton";
import MatrixHeatmapPanel from "@/components/matrix/MatrixHeatmapPanel";
import NetworkFilterRolePopover from "@/components/network/NetworkFilterRolePopover";
import {
  applyLinkMask,
  applyNodeMask,
  resolveAllowedSet,
} from "@/components/network/networkFormatting";
import { adaptDataByViewType } from "@/components/network/networkViewAdapters";
import { filterIsolatedMatrixEntries } from "@/utils/matrixFiltering";
import { getLegendRange } from "@/utils/matrixViewUtils";
import {
  applyNetworkZoom,
  patchNetworkMatrixSettings,
  resetNetworkZoomLabelSelection,
  stepNetworkZoomHistory,
  toggleNetworkZoomLabelSelection,
  updateNetworkViewStatRange,
} from "@/store/slices/networkVisualizationSlice";
import type { BuildPanelItem } from "@/components/network/panels/types";
import { StatusContent } from "@/components/network/panels/NetworkPanelCommon";

export const buildMatrixPanelItem: BuildPanelItem = ({
  computed,
  svgRef,
  matrixRecord,
  dataset,
  matrixShape,
  labelNames,
  defaultStatRanges,
  visibilityByViewId,
  nodeFilterContributors,
  linkFilterContributors,
  zoomTargetsByType,
  dispatch,
  markFormatting,
}) => {
  const view = computed.view;
  const valueFilters = {
    measure: computed.measureRange,
    stat: computed.statFilter,
  };
  const range = getLegendRange(
    matrixRecord.data,
    view.measureId,
    view.statId,
    dataset?.catalogs,
  );
  const canZoomBack = computed.zoomState.index > 0;
  const canZoomForward =
    computed.zoomState.index < computed.zoomState.history.length - 1;
  const canZoomByLabels = computed.orderedZoomLabels.length > 0;

  const allowedNodeIds = resolveAllowedSet(
    nodeFilterContributors,
    view.id,
    "nodeIds",
    visibilityByViewId,
  );
  const allowedLinkIds = resolveAllowedSet(
    linkFilterContributors,
    view.id,
    "linkIds",
    visibilityByViewId,
  );

  let maskedMatrix = computed.hideIsolatedNodes
    ? filterIsolatedMatrixEntries(
        computed.data,
        computed.rowLabels,
        computed.colLabels,
        valueFilters,
      )
    : {
        data: computed.data,
        rowLabels: computed.rowLabels,
        colLabels: computed.colLabels,
      };

  if (allowedNodeIds) {
    maskedMatrix = applyNodeMask({
      data: maskedMatrix.data,
      rowLabels: maskedMatrix.rowLabels ?? [],
      colLabels: maskedMatrix.colLabels ?? [],
      allowedNodeIds,
    });
  }
  if (allowedLinkIds) {
    maskedMatrix = {
      ...maskedMatrix,
      data: applyLinkMask({
        data: maskedMatrix.data,
        rowLabels: maskedMatrix.rowLabels ?? [],
        colLabels: maskedMatrix.colLabels ?? [],
        allowedLinkIds,
      }),
    };
  }
  if (computed.hideIsolatedNodes) {
    maskedMatrix = filterIsolatedMatrixEntries(
      maskedMatrix.data,
      maskedMatrix.rowLabels ?? [],
      maskedMatrix.colLabels ?? [],
      valueFilters,
    );
  }

  const adapted = adaptDataByViewType("matrix", {
    data: maskedMatrix.data,
    rowLabels: maskedMatrix.rowLabels ?? [],
    colLabels: maskedMatrix.colLabels ?? [],
  });

  const filterContent = (
    <NetworkFilterRolePopover
      statRangeValue={computed.statRangeValue}
      hasNegativeRange={computed.hasNegativeRange}
      statSliderMin={computed.statSliderMin}
      statSliderMax={computed.statSliderMax}
      measureRangeBounds={computed.measureRangeBounds}
      measureRangeValue={computed.measureRangeValue}
      onStatRangeChange={(value, segment) =>
        dispatch(
          updateNetworkViewStatRange({
            viewId: view.id,
            value,
            segment,
            fallback: defaultStatRanges[view.statId],
          }),
        )
      }
      onMeasureRangeChange={(value) =>
        dispatch(
          patchNetworkMatrixSettings({
            viewId: view.id,
            patch: { measureRange: value },
          }),
        )
      }
      useAsNodeFilter={computed.useAsNodeFilter}
      onUseAsNodeFilterChange={(checked) =>
        dispatch(
          patchNetworkMatrixSettings({
            viewId: view.id,
            patch: { useAsNodeFilter: checked },
          }),
        )
      }
      nodeFilterMode={computed.nodeFilterMode}
      onNodeFilterModeChange={(value) =>
        dispatch(
          patchNetworkMatrixSettings({
            viewId: view.id,
            patch: { nodeFilterMode: value },
          }),
        )
      }
      useAsLinkFilter={computed.useAsLinkFilter}
      onUseAsLinkFilterChange={(checked) =>
        dispatch(
          patchNetworkMatrixSettings({
            viewId: view.id,
            patch: { useAsLinkFilter: checked },
          }),
        )
      }
      linkFilterMode={computed.linkFilterMode}
      onLinkFilterModeChange={(value) =>
        dispatch(
          patchNetworkMatrixSettings({
            viewId: view.id,
            patch: { linkFilterMode: value },
          }),
        )
      }
    />
  );

  const statusContent = (
    <StatusContent
      status={view.status}
      error={view.error}
      onRetry={() => dispatch(markFormatting({ viewId: view.id }))}
    />
  );

  return {
    id: view.id,
    title: `Matrix · ${view.label}`,
    actions: (
      <Space size={4}>
        <ChartDownloadButton svgRef={svgRef} fileName={`Matrix ${view.label}`} />
        <Button
          size="small"
          type={computed.brushEnabled ? "default" : "text"}
          aria-label="Toggle brush zoom"
          title="Brush zoom"
          icon={<SelectOutlined />}
          onClick={() =>
            dispatch(
              patchNetworkMatrixSettings({
                viewId: view.id,
                patch: { brushEnabled: !computed.brushEnabled },
              }),
            )
          }
        />
        <Button
          size="small"
          type="text"
          aria-label="Zoom to labels"
          title="Zoom to labels"
          icon={<ZoomInOutlined />}
          disabled={!canZoomByLabels}
          onClick={() =>
            canZoomByLabels &&
            dispatch(
              applyNetworkZoom({
                targetViewIds: zoomTargetsByType(view.id),
                selection: {
                  rows: computed.orderedZoomLabels,
                  cols: computed.orderedZoomLabels,
                },
              }),
            )
          }
        />
        <Button
          size="small"
          type="text"
          aria-label="Clear node selection"
          title="Clear node selection"
          icon={<ReloadOutlined />}
          disabled={computed.zoomLabelSelection.length === 0}
          onClick={() =>
            dispatch(
              resetNetworkZoomLabelSelection({
                viewId: view.id,
              }),
            )
          }
        />
        <Button
          size="small"
          type="text"
          aria-label="Zoom back"
          title="Zoom back"
          icon={<LeftOutlined />}
          disabled={!canZoomBack}
          onClick={() =>
            dispatch(
              stepNetworkZoomHistory({
                targetViewIds: zoomTargetsByType(view.id),
                delta: -1,
              }),
            )
          }
        />
        <Button
          size="small"
          type="text"
          aria-label="Zoom forward"
          title="Zoom forward"
          icon={<RightOutlined />}
          disabled={!canZoomForward}
          onClick={() =>
            dispatch(
              stepNetworkZoomHistory({
                targetViewIds: zoomTargetsByType(view.id),
                delta: 1,
              }),
            )
          }
        />
        <Popover
          content={filterContent}
          trigger="click"
          placement="rightTop"
          destroyTooltipOnHide
        >
          <Button
            size="small"
            type={
              computed.useAsNodeFilter || computed.useAsLinkFilter
                ? "default"
                : "text"
            }
            aria-label="Filter role settings"
            icon={<FilterOutlined />}
          />
        </Popover>
      </Space>
    ),
    content:
      view.status !== "ready" ? (
        statusContent
      ) : adapted.type === "matrix" ? (
        <MatrixHeatmapPanel
          data={adapted.payload.data}
          rowLabels={adapted.payload.rowLabels}
          colLabels={adapted.payload.colLabels}
          compoundId={view.compoundId}
          matrixLabel={view.label}
          labelNames={labelNames}
          svgRef={svgRef}
          matrixShape={matrixShape}
          legendMin={range.min}
          legendMax={range.max}
          valueFilters={valueFilters}
          brushEnabled={computed.brushEnabled}
          showAllLabels={Boolean(computed.zoomState.current)}
          selectedZoomLabels={computed.zoomLabelSelection}
          onLabelToggle={(label) =>
            dispatch(
              toggleNetworkZoomLabelSelection({
                viewId: view.id,
                label,
                orderedLabels: computed.availableLabels,
              }),
            )
          }
          onBrushZoom={(payload) => {
            if (payload.rowLabels.length === 0) return;
            if (payload.colLabels.length === 0) return;
            dispatch(
              applyNetworkZoom({
                targetViewIds: zoomTargetsByType(view.id),
                selection: {
                  rows: payload.rowLabels,
                  cols: payload.colLabels,
                },
              }),
            );
          }}
        />
      ) : (
        statusContent
      ),
  };
};
