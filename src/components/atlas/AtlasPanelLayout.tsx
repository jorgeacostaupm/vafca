import type { ReactNode } from "react";
import { Col, Row, Space } from "antd";

type AtlasPanelLayoutProps = {
  has3d: boolean;
  controls: ReactNode;
  filters: ReactNode;
  list: ReactNode;
  viewer: ReactNode;
};

export function AtlasPanelLayout({
  has3d,
  controls,
  filters,
  list,
  viewer,
}: AtlasPanelLayoutProps) {
  if (has3d) {
    return (
      <Row className="atlas-panel" gutter={[24, 24]} align="top">
        <Col xs={24} lg={10}>
          <div className="atlas-panel__list">
            {controls}
          </div>
        </Col>

        <Col xs={24} lg={14}>
          {viewer}
        </Col>

        <Col xs={24}>
          <div className="atlas-panel__list">
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {filters}
              {list}
            </Space>
          </div>
        </Col>
      </Row>
    );
  }

  return (
    <Row className="atlas-panel" gutter={[24, 24]} align="top">
      <Col xs={24}>
        <div className="atlas-panel__list">
          {controls}

          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {filters}
            {list}
          </Space>
        </div>
      </Col>
    </Row>
  );
}
