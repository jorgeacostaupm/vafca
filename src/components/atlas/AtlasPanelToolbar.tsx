import { Button, Space } from "antd";

type AtlasPanelToolbarProps = {
  onOpenManagement: () => void;
};

export default function AtlasPanelToolbar({
  onOpenManagement,
}: AtlasPanelToolbarProps) {
  return (
    <Space
      className="atlas-panel__toolbar"
      size={12}
      wrap
      style={{ width: "100%" }}
    >
      <Button onClick={onOpenManagement}>Upload Atlas</Button>
    </Space>
  );
}
