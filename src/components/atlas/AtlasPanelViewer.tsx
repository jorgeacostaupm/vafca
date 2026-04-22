import type { PointerEventHandler, RefObject } from "react";
import { Button, Space, Typography } from "antd";

type AtlasPanelViewerProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  viewerHeight: number;
  onResizePointerDown: PointerEventHandler<HTMLButtonElement>;
  onResizePointerMove: PointerEventHandler<HTMLButtonElement>;
  onResizePointerEnd: PointerEventHandler<HTMLButtonElement>;
  onApplyCameraPose: (x: number, y: number, z: number) => void;
};

export function AtlasPanelViewer({
  containerRef,
  viewerHeight,
  onResizePointerDown,
  onResizePointerMove,
  onResizePointerEnd,
  onApplyCameraPose,
}: AtlasPanelViewerProps) {
  return (
    <div className="atlas-panel__viewer">
      <div className="atlas-panel__viewer-header">
        <Space size={8}>
          <Button size="small" onClick={() => onApplyCameraPose(0, 1, 0)}>
            Front
          </Button>
          <Button size="small" onClick={() => onApplyCameraPose(1, 0, 0)}>
            Right
          </Button>
          <Button size="small" onClick={() => onApplyCameraPose(0, 0, 1)}>
            Top
          </Button>
          <Button size="small" onClick={() => onApplyCameraPose(-1, 0, 0)}>
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
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerEnd}
        onPointerCancel={onResizePointerEnd}
      />
    </div>
  );
}
