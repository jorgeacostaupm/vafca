import { DownOutlined, SelectOutlined } from "@ant-design/icons";
import { Button, Dropdown, type MenuProps } from "antd";

import type { MatrixBrushMode } from "@/types/matrixHeatmap";

type NetworkBrushControlsProps = {
  enabled: boolean;
  mode: MatrixBrushMode;
  isMatrixView: boolean;
  onChange: (patch: { brushEnabled?: boolean; brushMode?: MatrixBrushMode }) => void;
};

const BRUSH_LABEL_BY_MODE: Record<MatrixBrushMode, string> = {
  zoom: "Zoom",
  selectLinks: "Select",
  deselectLinks: "Remove",
};

const BRUSH_MENU_ITEMS: MenuProps["items"] = [
  {
    key: "zoom",
    label: "Zoom",
  },
  {
    key: "selectLinks",
    label: "Select",
  },
  {
    key: "deselectLinks",
    label: "Remove",
  },
];

export default function NetworkBrushControls({
  enabled,
  mode,
  isMatrixView,
  onChange,
}: NetworkBrushControlsProps) {
  const label = BRUSH_LABEL_BY_MODE[mode];
  const target = isMatrixView ? "matrix" : "link";

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    onChange({
      brushEnabled: true,
      brushMode: key as MatrixBrushMode,
    });
  };

  return (
    <Button.Group>
      <Button
        size="small"
        type={enabled ? "default" : "text"}
        aria-label={`Toggle ${target} brush`}
        title={label}
        icon={<SelectOutlined />}
        onClick={() =>
          onChange({
            brushEnabled: !enabled,
          })
        }
      />
      <Dropdown
        menu={{
          items: BRUSH_MENU_ITEMS,
          selectable: true,
          selectedKeys: [mode],
          onClick: handleMenuClick,
        }}
        trigger={["click"]}
      >
        <Button
          size="small"
          type={enabled ? "default" : "text"}
          aria-label={`${target} brush options`}
          title={`${target} brush options`}
          icon={<DownOutlined />}
        />
      </Dropdown>
    </Button.Group>
  );
}
