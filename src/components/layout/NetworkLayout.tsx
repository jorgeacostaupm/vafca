import { memo, useCallback, useMemo, useState } from "react";
import type { Layout } from "react-grid-layout";
import ReactGridLayout, { bottom, useContainerWidth } from "react-grid-layout";

import {
  DEFAULT_PANEL_GRID_COMPACTOR,
  DEFAULT_PANEL_GRID_CONFIG,
  DEFAULT_PANEL_GRID_DRAG_HANDLE,
} from "@/config/ui";
import type { NetworkLayoutProps } from "@/types/layout";

function getLayoutMinHeight(
  layout: NetworkLayoutProps["layout"],
  rowHeight: number,
  margin: [number, number],
) {
  const rowCount = bottom(layout) + DEFAULT_PANEL_GRID_CONFIG.bottomBufferRows;
  if (rowCount <= 0) return undefined;

  return rowCount * rowHeight + (rowCount + 1) * margin[1];
}

function NetworkLayout({
  panelIds,
  layout,
  renderPanel,
  setLayout,
  cols = DEFAULT_PANEL_GRID_CONFIG.columns,
  rowHeight = DEFAULT_PANEL_GRID_CONFIG.rowHeight,
  margin = DEFAULT_PANEL_GRID_CONFIG.margin,
  dragHandleClass = DEFAULT_PANEL_GRID_DRAG_HANDLE,
}: NetworkLayoutProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
  });
  const layoutMinHeight = useMemo(
    () => getLayoutMinHeight(layout, rowHeight, margin),
    [layout, margin, rowHeight],
  );
  const gridClassName = isInteracting
    ? "network-layout-grid network-layout-grid--interacting"
    : "network-layout-grid";
  const handleInteractionStart = useCallback(() => {
    setIsInteracting(true);
  }, []);
  const handleLayoutCommit = useCallback((nextLayout: Layout) => {
    setIsInteracting(false);
    setLayout(nextLayout.map((entry) => ({ ...entry })));
  }, [setLayout]);
  const panelElements = useMemo(
    () =>
      panelIds.map((id) => (
        <div key={id} className="panel-grid-item">
          {renderPanel(id)}
        </div>
      )),
    [panelIds, renderPanel],
  );

  return (
    <div ref={containerRef}>
      {mounted && (
        <ReactGridLayout
          width={width}
          className={gridClassName}
          layout={layout}
          onDragStart={handleInteractionStart}
          onDragStop={handleLayoutCommit}
          onResizeStart={handleInteractionStart}
          onResizeStop={handleLayoutCommit}
          compactor={DEFAULT_PANEL_GRID_COMPACTOR}
          gridConfig={{
            cols,
            rowHeight,
            margin,
          }}
          dragConfig={{
            enabled: true,
            handle: dragHandleClass,
          }}
          style={{ minHeight: layoutMinHeight }}
        >
          {panelElements}
        </ReactGridLayout>
      )}
    </div>
  );
}

export default memo(NetworkLayout);
