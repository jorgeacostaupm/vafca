import { Button, Space, Typography } from "antd";
import { type PointerEvent,useCallback, useMemo, useRef } from "react";
import { shallowEqual } from "react-redux";

import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectAtlasDisplayLabelsById,
  selectAtlasEnabledById,
} from "@/store/slices/atlasUi";
import { selectDatasetData } from "@/store/slices/dataset";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";

import { useAtlasScene } from "./atlasPanelHooks";
import { VIEWER_MIN_HEIGHT } from "./panelConstants";

type AtlasPanelViewerProps = {
  enableMeshPoints: boolean;
};

export function AtlasPanelViewer({ enableMeshPoints }: AtlasPanelViewerProps) {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const viewerHeight = useAppSelector(
    (state) => state.visualizationUi.atlasPanel.viewerHeight,
  );
  const enabledById = useAppSelector(selectAtlasEnabledById, shallowEqual);
  const displayLabelsById = useAppSelector(
    selectAtlasDisplayLabelsById,
    shallowEqual,
  );

  const resizeStateRef = useRef<{ startY: number; startHeight: number } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));

  const enable3d = useMemo(
    () => enableMeshPoints && Boolean(atlasDefinition?.rois?.length),
    [atlasDefinition, enableMeshPoints],
  );

  const { applyCameraPose } = useAtlasScene({
    atlasDefinition,
    enabledById,
    displayLabelsById,
    containerRef,
    enable3d,
  });

  const handleResizePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      resizeStateRef.current = {
        startY: event.clientY,
        startHeight: viewerHeight,
      };
    },
    [viewerHeight],
  );

  const handleResizePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;
      const delta = event.clientY - resizeState.startY;
      const nextHeight = Math.max(VIEWER_MIN_HEIGHT, resizeState.startHeight + delta);
      dispatch(setAtlasPanelState({ viewerHeight: nextHeight }));
    },
    [dispatch],
  );

  const handleResizePointerEnd = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!resizeStateRef.current) return;
      resizeStateRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [],
  );

  return (
    <div className="atlas-panel__viewer">
      <div className="atlas-panel__viewer-header">
        <Space size={8}>
          <Button size="small" onClick={() => applyCameraPose(0, 1, 0)}>
            Front
          </Button>
          <Button size="small" onClick={() => applyCameraPose(1, 0, 0)}>
            Right
          </Button>
          <Button size="small" onClick={() => applyCameraPose(0, 0, 1)}>
            Top
          </Button>
          <Button size="small" onClick={() => applyCameraPose(-1, 0, 0)}>
            Left
          </Button>
        </Space>
        <Typography.Text type="secondary">
          Double-click an ROI to hide it
        </Typography.Text>
      </div>

      <div
        className="atlas-panel__viewer-canvas"
        ref={containerRef}
        style={{ height: `${viewerHeight}px` }}
      />

      <button
        type="button"
        className="atlas-panel__viewer-resizer"
        aria-label="Resize atlas viewer"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerEnd}
        onPointerCancel={handleResizePointerEnd}
      />
    </div>
  );
}
