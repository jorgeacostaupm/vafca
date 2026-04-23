import { Col } from "antd";
import SelectorControls from "@/components/selectors/SelectorControls";

export default function NetworkSelectorSidebar() {
  return (
    <Col xs={24} lg={4}>
      <div className="matrix-sidebar">
        <SelectorControls />
      </div>
    </Col>
  );
}
