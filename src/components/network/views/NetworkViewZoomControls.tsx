import { FullscreenOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button } from "antd";

import { useNetworkZoomTargets } from "@/components/network/useNetworkZoomTargets";
import NetworkBrushControls from "@/components/network/views/NetworkBrushControls";
import NetworkZoomModesPopover from "@/components/network/views/NetworkZoomModesPopover";
import { useAppDispatch } from "@/store/hooks";
import { patchNetworkMatrixSettings, patchNetworkNodeLinkSettings, stepNetworkZoomHistory } from "@/store/slices/networkVisualization";
import type { MatrixBrushMode } from "@/types/matrixHeatmap";
import type { ComputedView, SharedNetworkViewSettings } from "@/types/networkVisualization";

type SharedPanelSettingsPatch = Partial<SharedNetworkViewSettings & { brushEnabled: boolean; brushMode: MatrixBrushMode }>;

type NetworkViewZoomControlsProps = {
  computed: ComputedView;
  isMatrixView: boolean;
  spatialVisible: boolean;
};

export default function NetworkViewZoomControls({ computed, isMatrixView, spatialVisible }: NetworkViewZoomControlsProps) {
  const { view } = computed;
  const dispatch = useAppDispatch();
  const zoomTargetsByType = useNetworkZoomTargets();
  const canZoomBack = computed.zoomState.index > 0;
  const canZoomForward = computed.zoomState.index < computed.zoomState.history.length - 1;
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

  return (
    <div className="network-view-zoom-controls" role="group" aria-label="Zoom and selection">
      {!spatialVisible && <NetworkBrushControls
        enabled={computed.brushEnabled}
        mode={computed.brushMode}
        isMatrixView={isMatrixView}
        onChange={patchSharedSettings}
      />}
      {!spatialVisible && !isMatrixView ? (
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
      <NetworkZoomModesPopover computed={computed} view={view} />
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
    </div>
  );
}
