import { Form, Space, Switch, Typography } from "antd";

type NetworkManagementControlsProps = {
  syncZoom: boolean;
  onToggleSyncZoom: (value: boolean) => void;
  hideIsolatedNodes: boolean;
  onToggleHideIsolatedNodes: (value: boolean) => void;
};

export default function NetworkManagementControls({
  syncZoom,
  onToggleSyncZoom,
  hideIsolatedNodes,
  onToggleHideIsolatedNodes,
}: NetworkManagementControlsProps) {
  return (
    <Space direction="vertical" size={8} style={{ width: "100%", marginBottom: 8 }}>
      <Typography.Text strong>Management</Typography.Text>
      <Form layout="vertical" style={{ marginBottom: 0 }}>
        <Form.Item label="Coordinated zoom">
          <Switch checked={syncZoom} onChange={onToggleSyncZoom} />
        </Form.Item>
        <Form.Item label="Hide isolated nodes" style={{ marginBottom: 0 }}>
          <Switch
            checked={hideIsolatedNodes}
            onChange={onToggleHideIsolatedNodes}
          />
        </Form.Item>
      </Form>
    </Space>
  );
}
