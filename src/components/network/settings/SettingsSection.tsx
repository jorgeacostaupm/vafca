import { Space, Typography } from "antd";
import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function SettingsSection({
  title,
  actions,
  children,
}: SettingsSectionProps) {
  return (
    <Space className="network-settings-section" direction="vertical" size={12}>
      <div className="network-settings-section__header">
        <Typography.Text className="network-settings-section__title">
          {title}
        </Typography.Text>
        {actions ? <div className="network-settings-section__actions">{actions}</div> : null}
      </div>
      {children}
    </Space>
  );
}
