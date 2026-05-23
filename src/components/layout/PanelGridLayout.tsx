import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
} from "react-grid-layout";
import { Button, Card, Space } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import {
  DEFAULT_PANEL_GRID_CONFIG,
  DEFAULT_PANEL_GRID_DRAG_HANDLE,
} from "@/config/ui";
import type { PanelGridLayoutProps } from "@/types/layout";

function getPanelCardClassName(className?: string) {
  return ["panel-card", className].filter(Boolean).join(" ");
}

export default function PanelGridLayout({
  items,
  layout,
  onRemove,
  setLayout,
  cols = DEFAULT_PANEL_GRID_CONFIG.columns,
  rowHeight = DEFAULT_PANEL_GRID_CONFIG.rowHeight,
  margin = DEFAULT_PANEL_GRID_CONFIG.margin,
  dragHandleClass = DEFAULT_PANEL_GRID_DRAG_HANDLE,
}: PanelGridLayoutProps) {
  const { width, containerRef, mounted } = useContainerWidth();

  return (
    <div ref={containerRef}>
      {mounted && (
        <ReactGridLayout
          width={width}
          layout={layout}
          onLayoutChange={(newLayout) => setLayout([...newLayout])}
          compactor={verticalCompactor}
          gridConfig={{
            cols,
            rowHeight,
            margin,
          }}
          dragConfig={{
            enabled: true,
            handle: dragHandleClass,
          }}
        >
          {items.map((item) => (
            <div key={item.id} className="panel-grid-item">
              <Card
                className={getPanelCardClassName(item.className)}
                size="small"
                title={
                  <div className="panel-card-title">
                    {item.headerStart}
                    <span className="panel-card-handle">{item.title}</span>
                  </div>
                }
                extra={
                  <Space className="panel-card-extra-actions" size={4} wrap>
                    {item.actions}
                    <Button
                      size="small"
                      type="text"
                      aria-label="Remove panel"
                      icon={<CloseOutlined />}
                      onClick={() => onRemove(item.id)}
                    />
                  </Space>
                }
                style={{ height: "100%" }}
              >
                {item.content}
              </Card>
            </div>
          ))}
        </ReactGridLayout>
      )}
    </div>
  );
}
