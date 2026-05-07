import { Typography } from "antd";
import {
  MATRIX_PREVIEW_HEIGHT,
  PREVIEW_PADDING,
  PREVIEW_SIZE,
} from "@/components/management/constants";

type MatrixHierarchyPreviewProps = {
  matrixPreviewIds: string[];
  activeRoiCount: number;
  nodeColors: Record<string, string>;
  displayWidth?: number;
  displayHeight?: number;
};

function MatrixHierarchyPreview({
  matrixPreviewIds,
  activeRoiCount,
  nodeColors,
  displayWidth = PREVIEW_SIZE,
  displayHeight = MATRIX_PREVIEW_HEIGHT,
}: MatrixHierarchyPreviewProps) {
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
        <Typography.Text type="secondary">Matrix X-axis preview</Typography.Text>
        <Typography.Text type="secondary">
          Showing {matrixPreviewIds.length} / {activeRoiCount} ROIs
        </Typography.Text>
      </div>
      <svg
        width="100%"
        height={displayHeight}
        viewBox={`0 0 ${PREVIEW_SIZE} ${MATRIX_PREVIEW_HEIGHT}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        <line
          x1={PREVIEW_PADDING}
          x2={PREVIEW_SIZE - PREVIEW_PADDING}
          y1={MATRIX_PREVIEW_HEIGHT / 2}
          y2={MATRIX_PREVIEW_HEIGHT / 2}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        {matrixPreviewIds.map((id, index) => {
          const innerWidth = PREVIEW_SIZE - PREVIEW_PADDING * 2;
          const total = Math.max(matrixPreviewIds.length, 1);
          const gap = 1.5;
          const slotWidth = innerWidth / total;
          const rectWidth = Math.max(1, slotWidth - gap);
          const rectHeight = 10;
          const x = PREVIEW_PADDING + index * slotWidth + (slotWidth - rectWidth) / 2;
          const y = MATRIX_PREVIEW_HEIGHT / 2 - rectHeight / 2;

          return (
            <rect
              key={id}
              x={x}
              y={y}
              width={rectWidth}
              height={rectHeight}
              rx={1}
              fill={nodeColors[id] ?? "var(--color-primary)"}
            >
              <title>{id}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

export default MatrixHierarchyPreview;
