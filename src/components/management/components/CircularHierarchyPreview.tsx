import { Typography } from "antd";
import type { CircularHierarchyLayoutPoint } from "@/types/circular";
import { PREVIEW_SIZE } from "@/components/management/constants";

type CircularHierarchyPreviewProps = {
  layout: CircularHierarchyLayoutPoint[];
  activeRoiCount: number;
  previewRadius: number;
  nodeColors: Record<string, string>;
  displayWidth?: number;
};

function CircularHierarchyPreview({
  layout,
  activeRoiCount,
  previewRadius,
  nodeColors,
  displayWidth = PREVIEW_SIZE,
}: CircularHierarchyPreviewProps) {
  return (
    <div
      style={{
        width: displayWidth,
        maxWidth: "100%",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-2)",
        borderRadius: 8,
        padding: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <Typography.Text type="secondary">Circular preview</Typography.Text>
        <Typography.Text type="secondary">
          Showing {layout.length} / {activeRoiCount} ROIs
        </Typography.Text>
      </div>
      <svg
        width="100%"
        height={displayWidth}
        viewBox={`0 0 ${PREVIEW_SIZE} ${PREVIEW_SIZE}`}
        style={{ display: "block" }}
      >
        <circle
          cx={PREVIEW_SIZE / 2}
          cy={PREVIEW_SIZE / 2}
          r={previewRadius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        {layout.map((node) => (
          <circle
            key={node.labelId}
            cx={PREVIEW_SIZE / 2 + node.x}
            cy={PREVIEW_SIZE / 2 + node.y}
            r={2}
            fill={nodeColors[node.labelId] ?? "var(--color-primary)"}
          >
            <title>{node.labelId}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

export default CircularHierarchyPreview;
