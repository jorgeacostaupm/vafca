import * as d3 from "d3";
import { escapeHtml } from "@/utils/html";
import {
  buildRoiTooltipLabel,
  LINK_COLOR,
  LINK_NEGATIVE,
  LINK_POSITIVE,
  SELECTED_STROKE,
} from "@/components/nodelink/nodelinkShared";

export type CircularNode = {
  id: number;
  labelId?: string;
  label: string;
  angle: number;
  x: number;
  y: number;
};

export type CircularLink = {
  source: number;
  target: number;
  value: number;
  rowId: string;
  colId: string;
};

type RenderCircularElementsArgs = {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  nodes: CircularNode[];
  links: CircularLink[];
  diverging?: boolean;
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  selectedLinkIds: Set<string>;
  widthScale: d3.ScaleLinear<number, number>;
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
  labelAcronyms,
  selectedLinkIds,
  widthScale,
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

  const linkSelection = root
    .append("g")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("d", (link: CircularLink) => {
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
    .on("mouseenter", (event: MouseEvent, node: CircularNode) => {
      const labelId = node.labelId ?? String(node.id);
      const degree = degreeById.get(labelId) ?? 0;
      const tooltipLabel = buildRoiTooltipLabel(
        labelTitles?.[labelId] ?? node.label,
        labelAcronyms?.[labelId] ?? labelId,
      );
      showTooltip(
        `<div><strong>${escapeHtml(
          tooltipLabel,
        )}</strong></div><div>Links: ${degree}</div>`,
        event,
      );
      onNodeHover?.(labelId);
    })
    .on("mousemove", (event: MouseEvent) => moveTooltip(event))
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
      return shouldFlip ? -6 : 6;
    })
    .attr("dy", 3)
    .attr("text-anchor", (node: CircularNode) => {
      const angle = (node.angle * 180) / Math.PI;
      const normalizedAngle = ((angle % 360) + 360) % 360;
      const shouldFlip = normalizedAngle > 90 && normalizedAngle < 270;
      return shouldFlip ? "end" : "start";
    })
    .attr("font-size", 9)
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
