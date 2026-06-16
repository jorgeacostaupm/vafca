import { Space, Typography } from "antd";
import type { ReactNode } from "react";

type GroupingSettingsHeaderProps = {
  notice?: ReactNode;
};

export default function GroupingSettingsHeader({
  notice,
}: GroupingSettingsHeaderProps) {
  return (
    <Space direction="vertical" size={4} className="network-settings-grouping__stack">
      <span className="network-settings-grouping__title">
        <Typography.Text strong>Grouping fields</Typography.Text>
        {notice}
      </span>
      <Typography.Text type="secondary">
        These fields define the categorical grouping used by atlas nodes.
      </Typography.Text>
    </Space>
  );
}
