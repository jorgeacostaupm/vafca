import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import type { ReactNode } from "react";

type InlineNoticeTone = "info" | "warning";

type InlineNoticeProps = {
  label?: string;
  tone?: InlineNoticeTone;
  tooltip: ReactNode;
};

export default function InlineNotice({
  label,
  tone = "warning",
  tooltip,
}: InlineNoticeProps) {
  const Icon = tone === "warning" ? WarningOutlined : InfoCircleOutlined;
  const ariaLabel = label ?? (typeof tooltip === "string" ? tooltip : "Notice");

  return (
    <Tooltip title={tooltip}>
      <span
        className={`inline-notice inline-notice--${tone}`}
        aria-label={ariaLabel}
        role="img"
        tabIndex={0}
      >
        <Icon />
      </span>
    </Tooltip>
  );
}
