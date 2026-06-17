import { DatabaseOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";

type AtlasPanelToolbarProps = {
  onOpenManagement: () => void;
  onOpenSettings: () => void;
};

export default function AtlasPanelToolbar({
  onOpenManagement,
  onOpenSettings,
}: AtlasPanelToolbarProps) {
  return (
    <div className="network-action-toolbar atlas-panel__toolbar" aria-label="Atlas tools">
      <Space size={6}>
        <Tooltip title="Manage atlas data">
          <Button
            aria-label="Manage atlas data"
            icon={<DatabaseOutlined />}
            onClick={onOpenManagement}
          />
        </Tooltip>
        <Tooltip title="Atlas settings">
          <Button
            aria-label="Atlas settings"
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
          />
        </Tooltip>
      </Space>
    </div>
  );
}
