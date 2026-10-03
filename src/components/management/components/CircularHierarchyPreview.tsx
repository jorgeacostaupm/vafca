import * as d3 from "d3";

import { PREVIEW_SIZE } from "@/components/management/constants";
import {
  type CircularBundlePathPoint,
  type CircularHierarchyLayoutPoint,
  type CircularPreviewLink,
  DEFAULT_CIRCULAR_LINK_TENSION,
} from "@/types/circular";

type CircularHierarchyPreviewProps = {
  layout: CircularHierarchyLayoutPoint[];
  previewLinks?: CircularPreviewLink[];
  previewRadius: number;
  nodeColors: Record<string, string>;
  linkTension?: number;
  bundlingEnabled?: boolean;
  displayWidth?: number;
  linkColor?: string;
};

const buildFallbackPath = (
  source: CircularHierarchyLayoutPoint,
  target: CircularHierarchyLayoutPoint,
  linkTension: number,
) => {
  const controlX = ((source.x + target.x) / 2) * (1 - linkTension);
  const controlY = ((source.y + target.y) / 2) * (1 - linkTension);
  const path = d3.path();
  path.moveTo(source.x, source.y);
  path.quadraticCurveTo(controlX, controlY, target.x, target.y);
  return path.toString();
};

function CircularHierarchyPreview({
  layout,
  previewLinks = [],
  previewRadius,
  nodeColors,
  linkTension = DEFAULT_CIRCULAR_LINK_TENSION,
  bundlingEnabled = true,
  displayWidth = PREVIEW_SIZE,
  linkColor = "var(--color-primary)",
}: CircularHierarchyPreviewProps) {
  const layoutByLabelId = new Map(layout.map((node) => [node.labelId, node] as const));
  const bundledLine = d3
    .lineRadial<CircularBundlePathPoint>()
    .curve(d3.curveBundle.beta(linkTension))
    .angle((point) => point.angle)
    .radius((point) => point.radius);

  const getLinkPath = (link: CircularPreviewLink) => {
    if (bundlingEnabled && link.path && link.path.length > 1) {
      return bundledLine(link.path);
    }

    const source = layoutByLabelId.get(link.sourceLabelId);
    const target = layoutByLabelId.get(link.targetLabelId);
    if (!source || !target) return null;

    return buildFallbackPath(source, target, linkTension);
  };

  return (
    <div className="circular-hierarchy-preview" style={{ width: displayWidth }}>
      <svg
        width="100%"
        viewBox={`0 0 ${PREVIEW_SIZE} ${PREVIEW_SIZE}`}
        role="img"
        aria-label="Connectogram node ordering preview"
      >
        <g transform={`translate(${PREVIEW_SIZE / 2}, ${PREVIEW_SIZE / 2})`}>
          <circle
            r={previewRadius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={1}
          />
          {previewLinks.map((link) => {
            const path = getLinkPath(link);
            if (!path) return null;

            return (
              <path
                key={link.id}
                d={path}
                fill="none"
                stroke={linkColor}
                strokeOpacity={0.28}
                strokeWidth={1.4}
              />
            );
          })}
          {layout.map((node) => (
            <circle
              key={node.labelId}
              cx={node.x}
              cy={node.y}
              r={2}
              fill={nodeColors[node.labelId] ?? "var(--color-primary)"}
            >
              <title>{node.labelId}</title>
            </circle>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default CircularHierarchyPreview;
