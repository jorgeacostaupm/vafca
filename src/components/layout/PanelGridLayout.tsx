import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
} from "react-grid-layout";
import { Button, Card, Space } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import type { PanelGridLayoutProps } from "@/types/layout";


const DEFAULT_COLS = 24;
const DEFAULT_ROW_HEIGHT = 100;
const DEFAULT_MARGIN: [number, number] = [10, 10];
const DEFAULT_DRAG_HANDLE = ".panel-card-handle";

export default function PanelGridLayout({
  items,
  layout,
  onRemove,
  setLayout,
  cols = DEFAULT_COLS,
  rowHeight = DEFAULT_ROW_HEIGHT,
  margin = DEFAULT_MARGIN,
  dragHandleClass = DEFAULT_DRAG_HANDLE,
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
                size="small"
                title={<span className="panel-card-handle">{item.title}</span>}
                extra={
                  <Space size={4}>
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
                bodyStyle={{ height: "calc(100% - 56px)" }}
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
