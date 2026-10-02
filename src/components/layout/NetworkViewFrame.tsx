import { CloseOutlined } from "@ant-design/icons";
import { Button, Card, Space } from "antd";
import type { ReactNode } from "react";

type NetworkViewFrameProps = {
  title: string;
  onRemove?: () => void;
  toolbar?: ReactNode;
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
  toolbar,
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
      {toolbar || footer ? (
        <div className="network-view-frame__body">
          {toolbar && <div className="network-view-frame__toolbar">{toolbar}</div>}
          <div className="network-view-frame__content">{children}</div>
          {footer && <div className="network-view-frame__footer">{footer}</div>}
        </div>
      ) : children}
    </Card>
  );
}
