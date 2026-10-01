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
        These fields define node and label colors. Configure ordering separately in each view’s settings.
      </Typography.Text>
    </Space>
  );
}
