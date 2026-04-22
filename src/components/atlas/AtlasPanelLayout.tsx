import type { ComponentProps } from "react";
import { Col, Row, Space } from "antd";
import { AtlasPanelControls } from "./AtlasPanelControls";
import { AtlasPanelFilters } from "./AtlasPanelFilters";
import { AtlasPanelList } from "./AtlasPanelList";
import { AtlasPanelViewer } from "./AtlasPanelViewer";

type AtlasPanelLayoutProps = {
  has3d: boolean;
  controlsProps: ComponentProps<typeof AtlasPanelControls>;
  filtersProps: ComponentProps<typeof AtlasPanelFilters>;
  listProps: ComponentProps<typeof AtlasPanelList>;
  viewerProps: ComponentProps<typeof AtlasPanelViewer>;
};

export function AtlasPanelLayout({
  has3d,
  controlsProps,
  filtersProps,
  listProps,
  viewerProps,
}: AtlasPanelLayoutProps) {
  if (has3d) {
    return (
      <Row className="atlas-panel" gutter={[24, 24]} align="top">
        <Col xs={24} lg={10}>
          <div className="atlas-panel__list">
            <AtlasPanelControls {...controlsProps} />
          </div>
        </Col>

        <Col xs={24} lg={14}>
          <AtlasPanelViewer {...viewerProps} />
        </Col>

        <Col xs={24}>
          <div className="atlas-panel__list">
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <AtlasPanelFilters {...filtersProps} />
              <AtlasPanelList {...listProps} />
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
          <AtlasPanelControls {...controlsProps} />

          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <AtlasPanelFilters {...filtersProps} />
            <AtlasPanelList {...listProps} />
          </Space>
        </div>
      </Col>
    </Row>
  );
}
