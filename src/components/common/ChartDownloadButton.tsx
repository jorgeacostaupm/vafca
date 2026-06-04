import { DownloadOutlined } from "@ant-design/icons";
import { Button, Dropdown, type MenuProps } from "antd";
import { type RefObject,useCallback } from "react";

import { exportSvgElement } from "@/utils/svgExport";

type ChartDownloadButtonProps = {
  svgRef: RefObject<SVGSVGElement | null>;
  fileName: string;
  size?: "small" | "middle" | "large";
};

const menuItems: MenuProps["items"] = [
  { key: "svg", label: "SVG" },
  { key: "png-2", label: "PNG (2x)" },
  { key: "png-4", label: "PNG (4x)" },
  { key: "jpeg-2", label: "JPEG (2x)" },
];

export default function ChartDownloadButton({
  svgRef,
  fileName,
  size = "small",
}: ChartDownloadButtonProps) {
  const handleClick = useCallback<NonNullable<MenuProps["onClick"]>>(
    (info) => {
      const svg = svgRef.current;
      if (!svg) return;
      const key = String(info.key);
      if (key === "svg") {
        void exportSvgElement(svg, { format: "svg", fileName });
        return;
      }
      if (key === "png-2") {
        void exportSvgElement(svg, { format: "png", fileName, scale: 2 });
        return;
      }
      if (key === "png-4") {
        void exportSvgElement(svg, { format: "png", fileName, scale: 4 });
        return;
      }
      if (key === "jpeg-2") {
        void exportSvgElement(svg, {
          format: "jpeg",
          fileName,
          scale: 2,
          background: "#ffffff",
          quality: 0.92,
        });
      }
    },
    [fileName, svgRef],
  );

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleClick }}
      placement="bottomRight"
      trigger={["click"]}
    >
      <Button
        size={size}
        type="text"
        aria-label="Download chart"
        title="Download chart"
        icon={<DownloadOutlined />}
      />
    </Dropdown>
  );
}
