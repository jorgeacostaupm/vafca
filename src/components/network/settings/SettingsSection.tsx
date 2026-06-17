import { Typography } from "antd";
import type { ReactNode } from "react";

type SettingsSectionProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export default function SettingsSection({
  title,
  description,
  actions,
  children,
}: SettingsSectionProps) {
  const hasHeader = title || description || actions;

  return (
    <section className="network-settings-section">
      {hasHeader ? (
        <div className="network-settings-section__header">
          <div>
            {title ? (
              <Typography.Title level={5} className="network-settings-section__title">
                {title}
              </Typography.Title>
            ) : null}
            {description ? (
              <Typography.Text type="secondary" className="network-settings-section__description">
                {description}
              </Typography.Text>
            ) : null}
          </div>
          {actions ? <div className="network-settings-section__actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
