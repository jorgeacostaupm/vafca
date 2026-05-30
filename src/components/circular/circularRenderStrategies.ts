import * as d3 from "d3";
import { escapeHtml } from "@/utils/html";
import {
  DEFAULT_CIRCULAR_LINK_TENSION,
  type CircularBundlePathPoint,
} from "@/types/circular";
import {
  CIRCULAR_LABEL_DY,
  CIRCULAR_LABEL_FONT_SIZE,
  CIRCULAR_LABEL_OFFSET,
} from "@/config/ui";
import type { CircularLink, CircularNode } from "@/types/nodelink";
import {
  LINK_COLOR,
  LINK_NEGATIVE,
  LINK_POSITIVE,
  SELECTED_STROKE,
} from "@/components/nodelink/nodelinkShared";

const buildCircularNodeTooltipHtml = ({
  node,
  degree,
  labelTitles,
}: {
  node: CircularNode;
  degree: number;
  labelTitles?: Record<string, string>;
}) => {
  const labelId = node.labelId ?? String(node.id);
  const tooltipLabel = labelTitles?.[labelId] ?? node.label;

  return `<div><strong>${escapeHtml(
    tooltipLabel,
  )}</strong></div><div>Links: ${degree}</div>`;
};

type RenderCircularElementsArgs = {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  nodes: CircularNode[];
  links: CircularLink[];
  diverging?: boolean;
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  selectedLinkIds: Set<string>;
  widthScale: d3.ScaleLinear<number, number>;
  circularLinkTension?: number;
  circularBundlingEnabled?: boolean;
  nodeRadius: number;
  zoomLabelSet: Set<string> | null;
  degreeById: Map<string, number>;
  onLabelToggle?: (label: string) => void;
  onLinkSelect: (payload: {
    rowId: string;
    colId: string;
    value: number;
    rowLabel: string;
    colLabel: string;
  }) => void;
  onLinkHover?: (payload: { rowId: string; colId: string }) => void;
  onLinkLeave?: () => void;
  onNodeHover?: (id: string) => void;
  onNodeLeave?: () => void;
  getNodeColor: (node: CircularNode) => string;
  valueLabel?: string;
  showTooltip: (html: string, event: MouseEvent | PointerEvent) => void;
  showNodeTooltip: (html: string, node: CircularNode) => void;
  moveTooltip: (event: MouseEvent | PointerEvent) => void;
  hideTooltip: () => void;
  setLocalHoverActive: (active: boolean) => void;
};

export const renderCircularElements = ({
  root,
  nodes,
  links,
  diverging,
  labelNames,
  labelTitles,
  selectedLinkIds,
  widthScale,
  circularLinkTension = DEFAULT_CIRCULAR_LINK_TENSION,
  circularBundlingEnabled = true,
  nodeRadius,
  zoomLabelSet,
  degreeById,
  onLabelToggle,
  onLinkSelect,
  onLinkHover,
  onLinkLeave,
  onNodeHover,
  onNodeLeave,
  getNodeColor,
  valueLabel = "Value",
  showTooltip,
  showNodeTooltip,
  moveTooltip,
  hideTooltip,
  setLocalHoverActive,
}: RenderCircularElementsArgs) => {
  const isSelectedLink = (link: CircularLink) =>
    selectedLinkIds.has(`${link.rowId}::${link.colId}`) ||
    selectedLinkIds.has(`${link.colId}::${link.rowId}`);
  const linkOpacity = (link: CircularLink) => (isSelectedLink(link) ? 0.9 : 0.6);
  const linkStrokeWidth = (link: CircularLink) => {
    const base = widthScale(Math.abs(link.value));
    return isSelectedLink(link) ? Math.max(base, SELECTED_STROKE) : base;
  };
  const bundledLine = d3
    .lineRadial<CircularBundlePathPoint>()
    .curve(d3.curveBundle.beta(circularLinkTension))
    .angle((point) => point.angle)
    .radius((point) => point.radius);

  const linkSelection = root
    .append("g")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("d", (link: CircularLink) => {
      if (circularBundlingEnabled && link.bundlePath && link.bundlePath.length > 1) {
        return bundledLine(link.bundlePath);
      }

      const source = nodes[link.source];
      const target = nodes[link.target];
      const path = d3.path();
      path.moveTo(source.x, source.y);
      path.quadraticCurveTo(0, 0, target.x, target.y);
      return path.toString();
    })
    .attr("fill", "none")
    .attr("stroke", (link: CircularLink) => {
      if (!diverging) return LINK_COLOR;
      return link.value >= 0 ? LINK_POSITIVE : LINK_NEGATIVE;
    })
    .attr("stroke-opacity", (link: CircularLink) => linkOpacity(link))
    .attr("stroke-width", (link: CircularLink) => linkStrokeWidth(link))
    .style("cursor", "pointer")
    .on("click", (event: MouseEvent, link: CircularLink) => {
      event.stopPropagation();
      const rowLabel = labelNames?.[link.rowId] ?? link.rowId;
      const colLabel = labelNames?.[link.colId] ?? link.colId;
      onLinkSelect({
        rowId: link.rowId,
        colId: link.colId,
        value: link.value,
        rowLabel,
        colLabel,
      });
    })
    .on("mouseenter", (event: MouseEvent, link: CircularLink) => {
      const rowLabel = labelNames?.[link.rowId] ?? link.rowId;
      const colLabel = labelNames?.[link.colId] ?? link.colId;
      showTooltip(
        `<div><strong>${escapeHtml(
          `${rowLabel} ↔ ${colLabel}`,
        )}</strong></div><div>${escapeHtml(valueLabel)}: ${link.value.toFixed(4)}</div>`,
        event,
      );
      onLinkHover?.({ rowId: link.rowId, colId: link.colId });
    })
    .on("mousemove", (event: MouseEvent) => moveTooltip(event))
    .on("mouseleave", () => {
      hideTooltip();
      onLinkLeave?.();
    });

  const nodeSelection = root
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("cx", (node: CircularNode) => node.x)
    .attr("cy", (node: CircularNode) => node.y)
    .attr("r", nodeRadius)
    .attr("fill", (node: CircularNode) => getNodeColor(node))
    .style("cursor", "pointer")
    .on("mouseenter", (_event: MouseEvent, node: CircularNode) => {
      const labelId = node.labelId ?? String(node.id);
      const degree = degreeById.get(labelId) ?? 0;
      showNodeTooltip(
        buildCircularNodeTooltipHtml({ node, degree, labelTitles }),
        node,
      );
      onNodeHover?.(labelId);
    })
    .on("mousemove", (_event: MouseEvent, node: CircularNode) => {
      const labelId = node.labelId ?? String(node.id);
      const degree = degreeById.get(labelId) ?? 0;
      showNodeTooltip(
        buildCircularNodeTooltipHtml({ node, degree, labelTitles }),
        node,
      );
    })
    .on("mouseleave", () => {
      hideTooltip();
      onNodeLeave?.();
    });

  const labelSelection = root
    .append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("transform", (node: CircularNode) => {
      const angle = (node.angle * 180) / Math.PI;
      const normalizedAngle = ((angle % 360) + 360) % 360;
      const shouldFlip = normalizedAngle > 90 && normalizedAngle < 270;
      const rotation = shouldFlip ? angle + 180 : angle;
      return `translate(${node.x}, ${node.y}) rotate(${rotation})`;
    })
    .attr("x", (node: CircularNode) => {
      const angle = (node.angle * 180) / Math.PI;
      const normalizedAngle = ((angle % 360) + 360) % 360;
      const shouldFlip = normalizedAngle > 90 && normalizedAngle < 270;
      return shouldFlip ? -CIRCULAR_LABEL_OFFSET : CIRCULAR_LABEL_OFFSET;
    })
    .attr("dy", CIRCULAR_LABEL_DY)
    .attr("text-anchor", (node: CircularNode) => {
      const angle = (node.angle * 180) / Math.PI;
      const normalizedAngle = ((angle % 360) + 360) % 360;
      const shouldFlip = normalizedAngle > 90 && normalizedAngle < 270;
      return shouldFlip ? "end" : "start";
    })
    .attr("font-size", CIRCULAR_LABEL_FONT_SIZE)
    .attr("fill", (node: CircularNode) =>
      node.labelId && zoomLabelSet?.has(node.labelId) ? "#1b2b38" : "#394b59",
    )
    .attr("font-weight", (node: CircularNode) =>
      node.labelId && zoomLabelSet?.has(node.labelId) ? 700 : 400,
    )
    .style("cursor", onLabelToggle ? "pointer" : "default")
    .text((node: CircularNode) => node.label)
    .on("mouseenter", (_event: MouseEvent, node: CircularNode) => {
      const labelId = node.labelId ?? String(node.id);
      setLocalHoverActive(true);
      onNodeHover?.(labelId);
    })
    .on("mouseleave", () => {
      setLocalHoverActive(false);
      onNodeLeave?.();
    })
    .on("click", (event: MouseEvent, node: CircularNode) => {
      if (!onLabelToggle || !node.labelId) return;
      event.stopPropagation();
      onLabelToggle(node.labelId);
    });

  return { linkSelection, nodeSelection, labelSelection };
};
