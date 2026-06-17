import { Space, Typography } from "antd";

type AtlasPanelControlsProps = {
  totalCount: number;
  enabledCount: number;
  effectiveEnabledCount: number;
};

export function AtlasPanelControls({
  totalCount,
  enabledCount,
  effectiveEnabledCount,
}: AtlasPanelControlsProps) {
  return (
    <Space direction="vertical" size={2} className="atlas-panel__controls">
      <div className="atlas-panel__controls-header">
        <Space direction="vertical" size={2}>
          <Typography.Title level={4} className="atlas-panel__controls-title">
            Nodes Management
          </Typography.Title>
          <Typography.Text type="secondary" className="atlas-panel__node-summary">
            <span>{totalCount} nodes</span>
            <span>{enabledCount} active now</span>
            <span>{effectiveEnabledCount} after applying selection</span>
          </Typography.Text>
        </Space>
      </div>
    </Space>
  );
}
