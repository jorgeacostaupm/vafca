import { CloseOutlined } from "@ant-design/icons";
import { Button, Card, Space } from "antd";
import type { ReactNode } from "react";

type NetworkViewFrameProps = {
  title: string;
  onRemove?: () => void;
  viewSelector?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

function getNetworkViewFrameClassName(className?: string) {
  return ["panel-card", className].filter(Boolean).join(" ");
}

export default function NetworkViewFrame({
  title,
  onRemove,
  viewSelector,
  actions,
  footer,
  className,
  children,
}: NetworkViewFrameProps) {
  return (
    <Card
      className={getNetworkViewFrameClassName(className)}
      size="small"
      title={
        <div className="panel-card-title">
          <span className="panel-card-handle" title={title}>{title}</span>
        </div>
      }
      extra={
        <Space className="panel-card-extra-actions" size={4} wrap>
          {viewSelector}
          {actions}
          {onRemove && <Button
            size="small"
            type="text"
            aria-label="Remove panel"
            icon={<CloseOutlined />}
            onClick={onRemove}
          />}
        </Space>
      }
      style={{ height: "100%" }}
    >
      {footer ? (
        <div className="network-view-frame__body">
          <div className="network-view-frame__content">{children}</div>
          <div className="network-view-frame__footer">{footer}</div>
        </div>
      ) : children}
    </Card>
  );
}
