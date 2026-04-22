import { Typography } from "antd";
import type { CircularHierarchyLayoutPoint } from "@/types/circular";
import { PREVIEW_SIZE } from "@/components/management/constants";

type CircularHierarchyPreviewProps = {
  layout: CircularHierarchyLayoutPoint[];
  activeRoiCount: number;
  previewRadius: number;
  nodeColors: Record<string, string>;
};

function CircularHierarchyPreview({
  layout,
  activeRoiCount,
  previewRadius,
  nodeColors,
}: CircularHierarchyPreviewProps) {
  return (
    <div
      style={{
        width: PREVIEW_SIZE,
        maxWidth: "100%",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-2)",
        borderRadius: 8,
        padding: 8,
      }}
    >
      <Typography.Text type="secondary">Circular preview</Typography.Text>
      <svg width={PREVIEW_SIZE} height={PREVIEW_SIZE} style={{ display: "block" }}>
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
      <Typography.Text type="secondary">
        Showing {layout.length} / {activeRoiCount} ROIs
      </Typography.Text>
    </div>
  );
}

export default CircularHierarchyPreview;
