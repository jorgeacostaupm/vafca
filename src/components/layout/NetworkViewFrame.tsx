import { CloseOutlined } from "@ant-design/icons";
import { Button, Card, Space } from "antd";
import type { ReactNode } from "react";

type NetworkViewFrameProps = {
  title: string;
  onRemove: () => void;
  headerStart?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

function getNetworkViewFrameClassName(className?: string) {
  return ["panel-card", className].filter(Boolean).join(" ");
}

export default function NetworkViewFrame({
  title,
  onRemove,
  headerStart,
  actions,
  className,
  children,
}: NetworkViewFrameProps) {
  return (
    <Card
      className={getNetworkViewFrameClassName(className)}
      size="small"
      title={
        <div className="panel-card-title">
          {headerStart}
          <span className="panel-card-handle">{title}</span>
        </div>
      }
      extra={
        <Space className="panel-card-extra-actions" size={4} wrap>
          {actions}
          <Button
            size="small"
            type="text"
            aria-label="Remove panel"
            icon={<CloseOutlined />}
            onClick={onRemove}
          />
        </Space>
      }
      style={{ height: "100%" }}
    >
      {children}
    </Card>
  );
}
