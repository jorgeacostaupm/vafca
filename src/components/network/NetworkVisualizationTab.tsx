import { useState } from "react";
import { SettingOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";
import NetworkVisualizationSelector from "@/components/network/NetworkVisualizationSelector";
import NetworkVisualizationSettingsModal from "@/components/network/settings/NetworkVisualizationSettingsModal";

export default function NetworkVisualizationTab() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <Space direction="vertical" size={32} style={{ width: "100%" }}>
      <Button
        icon={<SettingOutlined />}
        onClick={() => setSettingsOpen(true)}
        style={{ alignSelf: "flex-start" }}
      >
        Visualization settings
      </Button>
      <NetworkVisualizationSelector />
      <NetworkVisualizationSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Space>
  );
}
