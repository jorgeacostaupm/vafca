import { memo, useCallback, useMemo, useState } from "react";
import type { Layout, LayoutItem } from "react-grid-layout";
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
  containerPadding: [number, number] | null,
) {
  const rowCount = bottom(layout) + DEFAULT_PANEL_GRID_CONFIG.bottomBufferRows;
  if (rowCount <= 0) return undefined;

  const verticalPadding = containerPadding?.[1] ?? margin[1];

  return (
    rowCount * rowHeight +
    Math.max(0, rowCount - 1) * margin[1] +
    verticalPadding * 2
  );
}

function applyInitialSizeConstraints(
  layout: NetworkLayoutProps["layout"],
  width: number,
  cols: number,
  rowHeight: number,
  margin: [number, number],
): LayoutItem[] {
  return layout.map((item) => {
    const constraints = item.constraints ?? [];
    if (constraints.length === 0) return item;

    const size = constraints.reduce(
      (current, constraint) =>
        constraint.constrainSize?.(item, current.w, current.h, "se", {
          cols,
          maxRows: Infinity,
          containerWidth: width,
          containerHeight: 0,
          rowHeight,
          margin,
          layout,
        }) ?? current,
      { w: item.w, h: item.h },
    );

    return size.w === item.w && size.h === item.h ? item : { ...item, ...size };
  });
}

function NetworkLayout({
  panelIds,
  layout,
  renderPanel,
  setLayout,
  cols = DEFAULT_PANEL_GRID_CONFIG.columns,
  rowHeight = DEFAULT_PANEL_GRID_CONFIG.rowHeight,
  margin = DEFAULT_PANEL_GRID_CONFIG.margin,
  containerPadding = DEFAULT_PANEL_GRID_CONFIG.containerPadding,
  dragHandleClass = DEFAULT_PANEL_GRID_DRAG_HANDLE,
}: NetworkLayoutProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
  });
  const constrainedLayout = useMemo(
    () => applyInitialSizeConstraints(layout, width, cols, rowHeight, margin),
    [cols, layout, margin, rowHeight, width],
  );
  const layoutMinHeight = useMemo(
    () =>
      getLayoutMinHeight(constrainedLayout, rowHeight, margin, containerPadding),
    [constrainedLayout, containerPadding, margin, rowHeight],
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
          layout={constrainedLayout}
          onDragStart={handleInteractionStart}
          onDragStop={handleLayoutCommit}
          onResizeStart={handleInteractionStart}
          onResizeStop={handleLayoutCommit}
          compactor={DEFAULT_PANEL_GRID_COMPACTOR}
          gridConfig={{
            cols,
            rowHeight,
            margin,
            containerPadding,
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
