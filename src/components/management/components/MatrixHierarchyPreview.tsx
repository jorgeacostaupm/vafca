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
  orientation?: "horizontal" | "vertical";
};

function MatrixHierarchyPreview({
  matrixPreviewIds,
  activeRoiCount,
  nodeColors,
  displayWidth = PREVIEW_SIZE,
  displayHeight = MATRIX_PREVIEW_HEIGHT,
  orientation = "horizontal",
}: MatrixHierarchyPreviewProps) {
  const isVertical = orientation === "vertical";

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
          flexDirection: isVertical ? "column" : "row",
          justifyContent: isVertical ? "flex-start" : "space-between",
          gap: isVertical ? 2 : 12,
          alignItems: isVertical ? "flex-start" : "center",
        }}
      >
        <Typography.Text type="secondary">
          {isVertical ? "Matrix preview" : "Matrix X-axis preview"}
        </Typography.Text>
        <Typography.Text type="secondary">
          {isVertical
            ? `${matrixPreviewIds.length} / ${activeRoiCount} ROIs`
            : `Showing ${matrixPreviewIds.length} / ${activeRoiCount} ROIs`}
        </Typography.Text>
      </div>
      <svg
        width="100%"
        height={displayHeight}
        viewBox={`0 0 ${PREVIEW_SIZE} ${MATRIX_PREVIEW_HEIGHT}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        {isVertical ? (
          <line
            x1={PREVIEW_SIZE / 2}
            x2={PREVIEW_SIZE / 2}
            y1={PREVIEW_PADDING / 2}
            y2={MATRIX_PREVIEW_HEIGHT - PREVIEW_PADDING / 2}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        ) : (
          <line
            x1={PREVIEW_PADDING}
            x2={PREVIEW_SIZE - PREVIEW_PADDING}
            y1={MATRIX_PREVIEW_HEIGHT / 2}
            y2={MATRIX_PREVIEW_HEIGHT / 2}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        )}
        {matrixPreviewIds.map((id, index) => {
          const innerLength = isVertical
            ? MATRIX_PREVIEW_HEIGHT - PREVIEW_PADDING
            : PREVIEW_SIZE - PREVIEW_PADDING * 2;
          const total = Math.max(matrixPreviewIds.length, 1);
          const gap = 1.5;
          const slotLength = innerLength / total;
          const rectLength = Math.max(1, slotLength - gap);
          const rectThickness = 10;
          const x = isVertical
            ? PREVIEW_SIZE / 2 - rectThickness / 2
            : PREVIEW_PADDING + index * slotLength + (slotLength - rectLength) / 2;
          const y = isVertical
            ? PREVIEW_PADDING / 2 + index * slotLength + (slotLength - rectLength) / 2
            : MATRIX_PREVIEW_HEIGHT / 2 - rectThickness / 2;
          const width = isVertical ? rectThickness : rectLength;
          const height = isVertical ? rectLength : rectThickness;

          return (
            <rect
              key={id}
              x={x}
              y={y}
              width={width}
              height={height}
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
