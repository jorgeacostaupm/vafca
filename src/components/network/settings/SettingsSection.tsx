import { Space, Typography } from "antd";
import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

export default function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <Space className="network-settings-section" direction="vertical" size={12}>
      <Typography.Text className="network-settings-section__title">
        {title}
      </Typography.Text>
      {children}
    </Space>
  );
}
