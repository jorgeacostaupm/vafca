import { ArrowLeftOutlined, ArrowRightOutlined, ArrowUpOutlined, EyeInvisibleOutlined, VerticalAlignMiddleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import type { ReactNode } from "react";


type NetworkSpatialControlsProps = {
  children?: ReactNode;
  hideInactiveRois?: boolean;
  onToggleInactiveRois?: () => void;
  onCameraPose: (x: number, y: number, z: number) => void;
};

export default function NetworkSpatialControls({ children, hideInactiveRois, onToggleInactiveRois, onCameraPose }: NetworkSpatialControlsProps) {
  return (
    <div className="network-view-zoom-controls" role="group" aria-label="3D view controls">
      <Button size="small" aria-label="Front view" title="Front view" icon={<VerticalAlignMiddleOutlined />} onClick={() => onCameraPose(0, 1, 0)} />
      <Button size="small" aria-label="Right view" title="Right view" icon={<ArrowRightOutlined />} onClick={() => onCameraPose(1, 0, 0)} />
      <Button size="small" aria-label="Top view" title="Top view" icon={<ArrowUpOutlined />} onClick={() => onCameraPose(0, 0, 1)} />
      <Button size="small" aria-label="Left view" title="Left view" icon={<ArrowLeftOutlined />} onClick={() => onCameraPose(-1, 0, 0)} />
      {onToggleInactiveRois && (
        <Button
          size="small"
          type={hideInactiveRois ? "primary" : "text"}
          icon={<EyeInvisibleOutlined />}
          aria-label="Hide ROIs without visible links"
          aria-pressed={hideInactiveRois}
          title={hideInactiveRois ? "Show all ROIs" : "Hide ROIs without visible links"}
          onClick={onToggleInactiveRois}
        />
      )}
      {children}
    </div>
  );
}
