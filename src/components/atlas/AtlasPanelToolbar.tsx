import { Button, Space } from "antd";
import type { AtlasMeshMode } from "@/types/atlas";
import { AtlasMeshModeControl } from "@/components/atlas/AtlasUploader";

type AtlasPanelToolbarProps = {
  meshMode: AtlasMeshMode;
  onMeshModeChange: (meshMode: AtlasMeshMode) => void;
  onOpenManagement: () => void;
};

export default function AtlasPanelToolbar({
  meshMode,
  onMeshModeChange,
  onOpenManagement,
}: AtlasPanelToolbarProps) {
  return (
    <Space
      className="atlas-panel__toolbar"
      size={12}
      wrap
      style={{ width: "100%" }}
    >
      <AtlasMeshModeControl
        meshMode={meshMode}
        onMeshModeChange={onMeshModeChange}
      />
      <Button onClick={onOpenManagement}>Upload Atlas</Button>
    </Space>
  );
}
