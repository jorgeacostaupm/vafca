import { Card, Space } from "antd";
import NetworkVisualizationSelector from "@/components/network/NetworkVisualizationSelector";
import SelectorControls from "@/components/selectors/SelectorControls";
import NetworkFilterStatus from "@/components/selectors/NetworkFilterStatus";

export default function NetworkVisualizationTab() {
  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card className="network-control-card" variant="outlined">
        <div className="network-control-card__selectors">
          <SelectorControls />
        </div>
        <NetworkFilterStatus />
      </Card>
      <NetworkVisualizationSelector />
    </Space>
  );
}
