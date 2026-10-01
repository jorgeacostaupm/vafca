import { ApartmentOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";

type AtlasPanelToolbarProps = {
  onOpenManagement: () => void;
};

export default function AtlasPanelToolbar({
  onOpenManagement,
}: AtlasPanelToolbarProps) {
  return (
    <div className="network-action-toolbar atlas-panel__toolbar" aria-label="Atlas tools">
      <Tooltip title="Define how nodes are grouped">
        <Button icon={<ApartmentOutlined />} onClick={onOpenManagement}>
          Define Groups
        </Button>
      </Tooltip>
    </div>
  );
}
