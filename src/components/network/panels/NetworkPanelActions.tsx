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
import NetworkFilterRolePopover from "@/components/network/NetworkFilterRolePopover";
import {
  applyNetworkZoom,
  patchNetworkNodeLinkSettings,
  patchNetworkMatrixSettings,
  resetNetworkZoomLabelSelection,
  stepNetworkZoomHistory,
  updateNetworkViewStatRange,
} from "@/store/slices/networkVisualization";
import { useAppDispatch } from "@/store/hooks";
import { useNetworkZoomTargets } from "@/components/network/useNetworkZoomTargets";
import type { ComputedView, SharedNetworkViewSettings } from "@/types/networkVisualization";
import type { NetworkPanelCommonProps } from "@/types/networkPanels";

type SharedPanelSettingsPatch = Partial<
  SharedNetworkViewSettings & { brushEnabled: boolean }
>;

type NetworkPanelActionsProps = {
  view: ComputedView["view"];
  computed: ComputedView;
  isMatrixView: boolean;
  viewTitle: string;
  svgRef: NetworkPanelCommonProps["svgRef"];
};

export default function NetworkPanelActions({
  view,
  computed,
  isMatrixView,
  viewTitle,
  svgRef,
}: NetworkPanelActionsProps) {
  const dispatch = useAppDispatch();
  const zoomTargetsByType = useNetworkZoomTargets();
  const canZoomBack = computed.zoomState.index > 0;
  const canZoomForward =
    computed.zoomState.index < computed.zoomState.history.length - 1;
  const canZoomByLabels = computed.orderedZoomLabels.length > 0;
  const patchSharedSettings = (patch: SharedPanelSettingsPatch) => {
    if (isMatrixView) {
      dispatch(
        patchNetworkMatrixSettings({
          viewId: view.id,
          patch,
        }),
      );
      return;
    }

    dispatch(
      patchNetworkNodeLinkSettings({
        viewId: view.id,
        patch,
      }),
    );
  };

  const filterContent = (
    <NetworkFilterRolePopover
      statRangeValue={computed.statRangeValue}
      hasNegativeRange={computed.hasNegativeRange}
      statSliderMin={computed.statSliderMin}
      statSliderMax={computed.statSliderMax}
      onStatRangeChange={(value, segment) =>
        dispatch(
          updateNetworkViewStatRange({
            viewId: view.id,
            value,
            segment,
            fallback: computed.statRangeValue,
          }),
        )
      }
      useAsNodeFilter={computed.useAsNodeFilter}
      onUseAsNodeFilterChange={(checked) =>
        patchSharedSettings({ useAsNodeFilter: checked })
      }
      nodeFilterMode={computed.nodeFilterMode}
      onNodeFilterModeChange={(value) =>
        patchSharedSettings({ nodeFilterMode: value })
      }
      useAsLinkFilter={computed.useAsLinkFilter}
      onUseAsLinkFilterChange={(checked) =>
        patchSharedSettings({ useAsLinkFilter: checked })
      }
      linkFilterMode={computed.linkFilterMode}
      onLinkFilterModeChange={(value) =>
        patchSharedSettings({ linkFilterMode: value })
      }
    />
  );

  return (
    <Space size={4}>
      <ChartDownloadButton svgRef={svgRef} fileName={`${viewTitle} ${view.label}`} />
      <Button
        size="small"
        type={computed.brushEnabled ? "default" : "text"}
        aria-label="Toggle brush zoom"
        title="Brush zoom"
        icon={<SelectOutlined />}
        onClick={() =>
          patchSharedSettings({
            brushEnabled: !computed.brushEnabled,
          })
        }
      />
      {!isMatrixView ? (
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
      ) : null}
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
  );
}
