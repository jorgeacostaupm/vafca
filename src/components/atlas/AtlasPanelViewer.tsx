import { Button } from "antd";
import { useMemo, useRef } from "react";
import { shallowEqual } from "react-redux";

import NetworkViewFrame from "@/components/layout/NetworkViewFrame";
import NetworkSpatialControls from "@/components/network/views/NetworkSpatialControls";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectAtlasDisplayLabelsById,
} from "@/store/slices/atlasUi";
import { selectDatasetData } from "@/store/slices/dataset";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";

import { useAtlasScene } from "./atlasPanelHooks";
import { buildEffectiveNodeEnabledMap } from "./nodeVisibilityDraft";

type AtlasPanelViewerProps = {
  enableSpatial: boolean;
};

export function AtlasPanelViewer({ enableSpatial }: AtlasPanelViewerProps) {
  const dispatch = useAppDispatch();
  const showInactiveNodes = useAppSelector(state => state.visualizationUi.atlasPanel.showInactiveNodes);
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const enabledById = useAppSelector(
    (state) => buildEffectiveNodeEnabledMap({
      order: state.atlasUi.order,
      labelsById: state.atlasUi.labelsById,
      draft: state.visualizationUi.atlasPanel.nodeVisibilityDraft,
    }),
    shallowEqual,
  );
  const displayLabelsById = useAppSelector(
    selectAtlasDisplayLabelsById,
    shallowEqual,
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));

  const enable3d = useMemo(
    () => enableSpatial && Boolean(atlasDefinition?.nodes?.length),
    [atlasDefinition, enableSpatial],
  );

  const { applyCameraPose } = useAtlasScene({
    atlasDefinition,
    enabledById,
    displayLabelsById,
    containerRef,
    enable3d,
  });

  return (
    <div className="atlas-panel__viewer">
      <NetworkViewFrame
        title="ROIs"
        actions={
          <Button
            size="small"
            type={showInactiveNodes ? "primary" : "default"}
            aria-pressed={Boolean(showInactiveNodes)}
            onClick={() => dispatch(setAtlasPanelState({ showInactiveNodes: !showInactiveNodes }))}
          >
            Show inactive
          </Button>
        }
        footer={
          <NetworkSpatialControls
            onCameraPose={applyCameraPose}
          />
        }
      >
        <div
          className="atlas-panel__viewer-canvas"
          ref={containerRef}
          title="Hover over a point to inspect ROI information"
        />
      </NetworkViewFrame>
    </div>
  );
}
