import ReactGridLayout, { bottom, useContainerWidth } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
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

export default function NetworkLayout({
  panelIds,
  layout,
  renderPanel,
  setLayout,
  cols = DEFAULT_PANEL_GRID_CONFIG.columns,
  rowHeight = DEFAULT_PANEL_GRID_CONFIG.rowHeight,
  margin = DEFAULT_PANEL_GRID_CONFIG.margin,
  dragHandleClass = DEFAULT_PANEL_GRID_DRAG_HANDLE,
}: NetworkLayoutProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const layoutMinHeight = getLayoutMinHeight(layout, rowHeight, margin);
  const handleLayoutUpdate = (nextLayout: Layout) => {
    setLayout(nextLayout.map((entry) => ({ ...entry })));
  };

  return (
    <div ref={containerRef}>
      {mounted && (
        <ReactGridLayout
          width={width}
          layout={layout}
          onLayoutChange={handleLayoutUpdate}
          onDrag={handleLayoutUpdate}
          onResize={handleLayoutUpdate}
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
          {panelIds.map((id) => (
            <div key={id} className="panel-grid-item">
              {renderPanel(id)}
            </div>
          ))}
        </ReactGridLayout>
      )}
    </div>
  );
}
