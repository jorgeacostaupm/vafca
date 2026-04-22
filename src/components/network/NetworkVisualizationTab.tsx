import { Space } from "antd";
import NetworkVisualizationSelector from "@/components/network/NetworkVisualizationSelector";

export default function NetworkVisualizationTab() {
  return (
    <Space direction="vertical" size={32} style={{ width: "100%" }}>
      <NetworkVisualizationSelector />
    </Space>
  );
}
