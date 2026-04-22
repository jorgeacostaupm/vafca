import { Button, Popover, Space } from "antd";
import {
  FilterOutlined,
  FullscreenOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  SelectOutlined,
  ZoomInOutlined,
} from "@ant-design/icons";
import ChartDownloadButton from "@/components/common/ChartDownloadButton";
import CircularNodeLinkPanel from "@/components/circular/CircularNodeLinkPanel";
import NodeLinkPanel from "@/components/nodelink/NodeLinkPanel";
import NetworkFilterRolePopover from "@/components/network/NetworkFilterRolePopover";
import { applyLinkMask, applyNodeMask, resolveAllowedSet } from "@/components/network/networkFormatting";
import { adaptDataByViewType } from "@/components/network/networkViewAdapters";
import {
  applyNetworkZoom,
  patchNetworkNodeLinkSettings,
  resetNetworkZoomLabelSelection,
  stepNetworkZoomHistory,
  toggleNetworkZoomLabelSelection,
  updateNetworkViewStatRange,
} from "@/store/slices/networkVisualizationSlice";
import type { BuildPanelItem } from "@/components/network/panels/types";
import { StatusContent } from "@/components/network/panels/NetworkPanelCommon";

export const buildNodeLinkPanelItem: BuildPanelItem = ({
  computed,
  svgRef,
  labelNames,
  labelTitles,
  labelAcronyms,
  nodeColors,
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

  let maskedNodeLink = {
    data: computed.data,
    rowLabels: computed.rowLabels,
  };
  if (allowedNodeIds) {
    const byNodes = applyNodeMask({
      data: maskedNodeLink.data,
      rowLabels: maskedNodeLink.rowLabels,
      colLabels: maskedNodeLink.rowLabels,
      allowedNodeIds,
    });
    maskedNodeLink = {
      data: byNodes.data,
      rowLabels: byNodes.rowLabels,
    };
  }
  if (allowedLinkIds) {
    maskedNodeLink = {
      ...maskedNodeLink,
      data: applyLinkMask({
        data: maskedNodeLink.data,
        rowLabels: maskedNodeLink.rowLabels,
        colLabels: maskedNodeLink.rowLabels,
        allowedLinkIds,
      }),
    };
  }

  const adapted = adaptDataByViewType(view.type, {
    data: maskedNodeLink.data,
    rowLabels: maskedNodeLink.rowLabels,
    colLabels: maskedNodeLink.rowLabels,
  });
  const viewTitle = view.type === "circular" ? "Circular" : "Node-Link";

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
          patchNetworkNodeLinkSettings({
            viewId: view.id,
            patch: { measureRange: value },
          }),
        )
      }
      useAsNodeFilter={computed.useAsNodeFilter}
      onUseAsNodeFilterChange={(checked) =>
        dispatch(
          patchNetworkNodeLinkSettings({
            viewId: view.id,
            patch: { useAsNodeFilter: checked },
          }),
        )
      }
      nodeFilterMode={computed.nodeFilterMode}
      onNodeFilterModeChange={(value) =>
        dispatch(
          patchNetworkNodeLinkSettings({
            viewId: view.id,
            patch: { nodeFilterMode: value },
          }),
        )
      }
      useAsLinkFilter={computed.useAsLinkFilter}
      onUseAsLinkFilterChange={(checked) =>
        dispatch(
          patchNetworkNodeLinkSettings({
            viewId: view.id,
            patch: { useAsLinkFilter: checked },
          }),
        )
      }
      linkFilterMode={computed.linkFilterMode}
      onLinkFilterModeChange={(value) =>
        dispatch(
          patchNetworkNodeLinkSettings({
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
    title: `${viewTitle} · ${view.label}`,
    actions: (
      <Space size={4}>
        <ChartDownloadButton svgRef={svgRef} fileName={`${viewTitle} ${view.label}`} />
        <Button
          size="small"
          type={computed.brushEnabled ? "default" : "text"}
          aria-label="Toggle brush zoom"
          title="Brush zoom"
          icon={<SelectOutlined />}
          onClick={() =>
            dispatch(
              patchNetworkNodeLinkSettings({
                viewId: view.id,
                patch: {
                  brushEnabled: !computed.brushEnabled,
                },
              }),
            )
          }
        />
        <Button
          size="small"
          type={computed.geometricZoomEnabled ? "default" : "text"}
          aria-label="Toggle geometric zoom"
          title="Geometric zoom"
          icon={<FullscreenOutlined />}
          onClick={() =>
            dispatch(
              patchNetworkNodeLinkSettings({
                viewId: view.id,
                patch: {
                  geometricZoomEnabled: !computed.geometricZoomEnabled,
                },
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
      ) : adapted.type === "node-link" ? (
        view.type === "circular" ? (
          <CircularNodeLinkPanel
            data={adapted.payload.data}
            labels={adapted.payload.labels}
            labelNames={labelNames}
            labelTitles={labelTitles}
            labelAcronyms={labelAcronyms}
            nodeColors={nodeColors}
            compoundId={view.compoundId}
            matrixLabel={view.label}
            svgRef={svgRef}
            valueFilters={valueFilters}
            selectedZoomLabels={computed.zoomLabelSelection}
            linkWidthRange={computed.linkWidthRange}
            brushEnabled={computed.brushEnabled}
            geometricZoomEnabled={computed.geometricZoomEnabled}
            hideIsolatedNodes={computed.hideIsolatedNodes}
            diverging={computed.hasNegativeRange}
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
              if (payload.labels.length === 0) return;
              dispatch(
                applyNetworkZoom({
                  targetViewIds: zoomTargetsByType(view.id),
                  selection: {
                    rows: payload.labels,
                    cols: payload.labels,
                  },
                }),
              );
            }}
          />
        ) : (
          <NodeLinkPanel
            data={adapted.payload.data}
            labels={adapted.payload.labels}
            labelNames={labelNames}
            labelTitles={labelTitles}
            labelAcronyms={labelAcronyms}
            nodeColors={nodeColors}
            compoundId={view.compoundId}
            matrixLabel={view.label}
            svgRef={svgRef}
            valueFilters={valueFilters}
            selectedZoomLabels={computed.zoomLabelSelection}
            linkWidthRange={computed.linkWidthRange}
            brushEnabled={computed.brushEnabled}
            geometricZoomEnabled={computed.geometricZoomEnabled}
            hideIsolatedNodes={computed.hideIsolatedNodes}
            diverging={computed.hasNegativeRange}
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
              if (payload.labels.length === 0) return;
              dispatch(
                applyNetworkZoom({
                  targetViewIds: zoomTargetsByType(view.id),
                  selection: {
                    rows: payload.labels,
                    cols: payload.labels,
                  },
                }),
              );
            }}
          />
        )
      ) : (
        statusContent
      ),
  };
};
