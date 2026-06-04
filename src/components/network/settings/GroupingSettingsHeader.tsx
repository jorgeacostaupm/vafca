import { Space, Typography } from "antd";

export default function GroupingSettingsHeader() {
  return (
    <Space direction="vertical" size={4} className="network-settings-grouping__stack">
      <Typography.Text strong>Grouping fields</Typography.Text>
      <Typography.Text type="secondary">
        These fields define the categorical grouping used by atlas nodes.
      </Typography.Text>
    </Space>
  );
}
