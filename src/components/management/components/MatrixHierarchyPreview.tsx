import {
  PREVIEW_PADDING,
  PREVIEW_SIZE,
} from "@/components/management/constants";
import { MATRIX_HIERARCHY_PREVIEW_BLOCK_GAP, MATRIX_HIERARCHY_PREVIEW_BLOCK_THICKNESS } from "@/config/ui";

type MatrixHierarchyPreviewProps = {
  matrixPreviewIds: string[];
  nodeColors: Record<string, string>;
  displayWidth?: number;
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
}: MatrixHierarchyPreviewProps) {
  const previewBlocks = buildMatrixPreviewBlocks(matrixPreviewIds, nodeColors);
  const innerLength = PREVIEW_SIZE - PREVIEW_PADDING * 2;
  const slotLength = innerLength / Math.max(matrixPreviewIds.length, 1);
  const gap = previewBlocks.length > 1 ? MATRIX_HIERARCHY_PREVIEW_BLOCK_GAP : 0;
  const thickness = MATRIX_HIERARCHY_PREVIEW_BLOCK_THICKNESS;

  return (
    <div className="matrix-hierarchy-preview" style={{ width: displayWidth }}>
      <svg
        width="100%"
        viewBox={`0 0 ${PREVIEW_SIZE} ${PREVIEW_SIZE}`}
        role="img"
        aria-label="Matrix node ordering preview: columns and rows"
      >
        <rect
          x={PREVIEW_PADDING}
          y={PREVIEW_PADDING}
          width={innerLength}
          height={innerLength}
          fill="none"
          stroke="var(--color-border)"
        />
        {previewBlocks.map((block) => {
          const start = PREVIEW_PADDING + block.startIndex * slotLength + gap / 2;
          const length = Math.max(1, slotLength * block.ids.length - gap);

          return (
            <g key={block.key} fill={block.color}>
              <title>{formatBlockTitle(block)}</title>
              <rect
                x={start}
                y={PREVIEW_PADDING - thickness}
                width={length}
                height={thickness}
                rx={2}
              />
              <rect
                x={PREVIEW_PADDING - thickness}
                y={start}
                width={thickness}
                height={length}
                rx={2}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default MatrixHierarchyPreview;
