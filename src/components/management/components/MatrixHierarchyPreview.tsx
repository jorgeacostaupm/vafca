import {
  MATRIX_PREVIEW_HEIGHT,
  PREVIEW_PADDING,
  PREVIEW_SIZE,
} from "@/components/management/constants";

type MatrixHierarchyPreviewProps = {
  matrixPreviewIds: string[];
  nodeColors: Record<string, string>;
  displayWidth?: number;
  displayHeight?: number;
  orientation?: "horizontal" | "vertical";
};

type MatrixPreviewBlock = {
  key: string;
  color: string;
  ids: string[];
  startIndex: number;
};

const buildMatrixPreviewBlocks = (
  ids: string[],
  nodeColors: Record<string, string>,
): MatrixPreviewBlock[] => {
  const blocks: MatrixPreviewBlock[] = [];

  ids.forEach((id, index) => {
    const color = nodeColors[id] ?? "var(--color-primary)";
    const previous = blocks.at(-1);

    if (previous?.color === color) {
      previous.ids.push(id);
      return;
    }

    blocks.push({
      key: `${color}-${index}`,
      color,
      ids: [id],
      startIndex: index,
    });
  });

  return blocks;
};

const formatBlockTitle = (block: MatrixPreviewBlock) => {
  const firstId = block.ids[0];
  const lastId = block.ids.at(-1);
  const rangeLabel = firstId === lastId ? firstId : `${firstId} -> ${lastId}`;

  return `${block.ids.length} node${block.ids.length === 1 ? "" : "s"}: ${rangeLabel}`;
};

function MatrixHierarchyPreview({
  matrixPreviewIds,
  nodeColors,
  displayWidth = PREVIEW_SIZE,
  displayHeight = MATRIX_PREVIEW_HEIGHT,
  orientation = "horizontal",
}: MatrixHierarchyPreviewProps) {
  const isVertical = orientation === "vertical";
  const previewBlocks = buildMatrixPreviewBlocks(matrixPreviewIds, nodeColors);

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
        {previewBlocks.map((block) => {
          const innerLength = isVertical
            ? MATRIX_PREVIEW_HEIGHT - PREVIEW_PADDING
            : PREVIEW_SIZE - PREVIEW_PADDING * 2;
          const total = Math.max(matrixPreviewIds.length, 1);
          const slotLength = innerLength / total;
          const gap = previewBlocks.length > 1 ? 1.5 : 0;
          const blockLength = slotLength * block.ids.length;
          const rectLength = Math.max(1, blockLength - gap);
          const rectThickness = 14;
          const x = isVertical
            ? PREVIEW_SIZE / 2 - rectThickness / 2
            : PREVIEW_PADDING + block.startIndex * slotLength + gap / 2;
          const y = isVertical
            ? PREVIEW_PADDING / 2 + block.startIndex * slotLength + gap / 2
            : MATRIX_PREVIEW_HEIGHT / 2 - rectThickness / 2;
          const width = isVertical ? rectThickness : rectLength;
          const height = isVertical ? rectLength : rectThickness;

          return (
            <rect
              key={block.key}
              x={x}
              y={y}
              width={width}
              height={height}
              rx={2}
              fill={block.color}
            >
              <title>{formatBlockTitle(block)}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

export default MatrixHierarchyPreview;
