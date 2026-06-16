import {
  EyeInvisibleOutlined,
  EyeOutlined,
  FilterOutlined,
  FullscreenOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Button, Popover } from "antd";
import type { RefObject } from "react";

import ChartDownloadButton from "@/components/common/ChartDownloadButton";
import NetworkFilterRolePopover from "@/components/network/NetworkFilterRolePopover";
import { useNetworkZoomTargets } from "@/components/network/useNetworkZoomTargets";
import NetworkBrushControls from "@/components/network/views/NetworkBrushControls";
import type { buildNetworkViewRenderData } from "@/components/network/views/networkViewData";
import NetworkZoomModesPopover from "@/components/network/views/NetworkZoomModesPopover";
import { useAppDispatch } from "@/store/hooks";
import {
  patchNetworkMatrixSettings,
  patchNetworkNodeLinkSettings,
  resetNetworkZoomLabelSelection,
  stepNetworkZoomHistory,
  updateNetworkViewStatRange,
} from "@/store/slices/networkVisualization";
import type { MatrixBrushMode } from "@/types/matrixHeatmap";
import type {
  ComputedView,
  SharedNetworkViewSettings,
} from "@/types/networkVisualization";

type SharedPanelSettingsPatch = Partial<
  SharedNetworkViewSettings & { brushEnabled: boolean; brushMode: MatrixBrushMode }
>;

type NetworkViewActionsProps = {
  view: ComputedView["view"];
  computed: ComputedView;
  renderData: ReturnType<typeof buildNetworkViewRenderData>;
  isMatrixView: boolean;
  viewTitle: string;
  svgRef: RefObject<SVGSVGElement | null>;
};

export default function NetworkViewActions({
  view,
  computed,
  renderData,
  isMatrixView,
  viewTitle,
  svgRef,
}: NetworkViewActionsProps) {
  const dispatch = useAppDispatch();
  const zoomTargetsByType = useNetworkZoomTargets();
  const canZoomBack = computed.zoomState.index > 0;
  const canZoomForward =
    computed.zoomState.index < computed.zoomState.history.length - 1;
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
      statCenter={computed.valueDomain.center ?? 0}
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
      useAsLinkFilter={computed.useAsLinkFilter}
      onUseAsLinkFilterChange={(checked) =>
        patchSharedSettings({ useAsLinkFilter: checked })
      }
    />
  );

  return (
    <div className="network-view-actions">
      <ChartDownloadButton svgRef={svgRef} fileName={`${viewTitle} ${view.label}`} />
      <NetworkBrushControls
        enabled={computed.brushEnabled}
        mode={computed.brushMode}
        isMatrixView={isMatrixView}
        onChange={patchSharedSettings}
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
        type={computed.selectionVisible ? "default" : "text"}
        aria-label={
          computed.selectionVisible ? "Hide selection" : "Show selection"
        }
        title={computed.selectionVisible ? "Hide selection" : "Show selection"}
        icon={
          computed.selectionVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />
        }
        onClick={() =>
          patchSharedSettings({
            selectionVisible: !computed.selectionVisible,
          })
        }
      />
      <NetworkZoomModesPopover view={view} computed={computed} renderData={renderData} />
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
    </div>
  );
}
