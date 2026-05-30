import type * as d3 from "d3";
import { escapeHtml } from "@/utils/html";
import { SELECTED_STROKE } from "@/components/nodelink/nodelinkShared";
import { CIRCULAR_NODE_HOVER_RADIUS_OFFSET } from "@/config/ui";
import type { CircularLink, CircularNode } from "@/types/nodelink";

type CircularLinkSelection = d3.Selection<SVGPathElement, CircularLink, SVGGElement, unknown>;
type CircularNodeSelection = d3.Selection<SVGCircleElement, CircularNode, SVGGElement, unknown>;
type CircularLabelSelection = d3.Selection<SVGTextElement, CircularNode, SVGGElement, unknown>;

export const applyCircularHoverSelectionStyles = (args: {
  linkSelection: CircularLinkSelection;
  nodeSelection: CircularNodeSelection;
  labelSelection: CircularLabelSelection;
  widthScale: d3.ScaleLinear<number, number>;
  zoomLabelSet: Set<string> | null;
  nodeRadius: number;
  hoveredCell?: { rowId: string; colId: string } | null;
  hoveredNodeId?: string | null;
  selectedLinkIds: Set<string>;
  getNodeColor: (node: CircularNode) => string;
  selectedColor: string;
}) => {
  const {
    linkSelection,
    nodeSelection,
    labelSelection,
    widthScale,
    zoomLabelSet,
    nodeRadius,
    hoveredCell,
    hoveredNodeId,
    selectedLinkIds,
    getNodeColor,
    selectedColor,
  } = args;
  const hovered = hoveredCell ?? null;
  const hoveredNode = hoveredNodeId ?? null;
  const isHoveredLink = (link: CircularLink) =>
    hovered
      ? (link.rowId === hovered.rowId && link.colId === hovered.colId) ||
        (link.rowId === hovered.colId && link.colId === hovered.rowId)
      : false;
  const isHoveredNodeLink = (link: CircularLink) =>
    hoveredNode ? link.rowId === hoveredNode || link.colId === hoveredNode : false;
  const isSelectedLink = (link: CircularLink) =>
    selectedLinkIds.has(`${link.rowId}::${link.colId}`) ||
    selectedLinkIds.has(`${link.colId}::${link.rowId}`);

  linkSelection
    .attr("stroke-opacity", (link: CircularLink) => {
      if (isSelectedLink(link)) {
        if (hovered) return isHoveredLink(link) ? 1 : 0.25;
        if (hoveredNode) return isHoveredNodeLink(link) ? 1 : 0.25;
        return 0.9;
      }
      if (hovered) {
        if (isHoveredLink(link)) return 1;
        return 0.2;
      }
      if (hoveredNode) {
        if (isHoveredNodeLink(link)) return 1;
        return 0.12;
      }
      return 0.6;
    })
    .attr("stroke-width", (link: CircularLink) => {
      const base = widthScale(Math.abs(link.value));
      if (isSelectedLink(link)) return Math.max(base, SELECTED_STROKE);
      if (hovered && isHoveredLink(link)) return Math.max(base + 0.8, SELECTED_STROKE);
      if (hoveredNode && isHoveredNodeLink(link)) return Math.max(base + 0.8, SELECTED_STROKE);
      return base;
    });

  nodeSelection
    .attr("r", (node: CircularNode) => {
      const labelId = node.labelId ?? String(node.id);
      const isHover = hoveredNode === labelId;
      return nodeRadius + (isHover ? CIRCULAR_NODE_HOVER_RADIUS_OFFSET : 0);
    })
    .attr("fill", (node: CircularNode) => {
      const labelId = node.labelId ?? String(node.id);
      if (hoveredNode === labelId) return selectedColor;
      return getNodeColor(node);
    })
    .attr("stroke", (node: CircularNode) => {
      const labelId = node.labelId ?? String(node.id);
      return hoveredNode === labelId ? selectedColor : "none";
    })
    .attr("stroke-width", (node: CircularNode) => {
      const labelId = node.labelId ?? String(node.id);
      return hoveredNode === labelId ? 1.1 : 0;
    });

  labelSelection
    .attr("fill", (node: CircularNode) => {
      const labelId = node.labelId ?? String(node.id);
      if (hoveredNode === labelId) return selectedColor;
      return node.labelId && zoomLabelSet?.has(node.labelId) ? "#1b2b38" : "#394b59";
    })
    .attr("font-weight", (node: CircularNode) => {
      const labelId = node.labelId ?? String(node.id);
      if (hoveredNode === labelId) return 700;
      return node.labelId && zoomLabelSet?.has(node.labelId) ? 700 : 400;
    });
};

export const syncCircularProgrammaticTooltip = (args: {
  tooltipEl: HTMLDivElement;
  wrapperEl: HTMLDivElement;
  nodes: CircularNode[];
  links: CircularLink[];
  degreeById: Map<string, number>;
  hoveredCell?: { rowId: string; colId: string } | null;
  hoveredNodeId?: string | null;
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  valueLabel?: string;
  width: number;
  height: number;
  zoomTransform: d3.ZoomTransform;
  positionTooltip: (x: number, y: number, wrapperRect: DOMRect) => void;
  positionNodeTooltip: (node: CircularNode, wrapperRect: DOMRect) => void;
}) => {
  const {
    tooltipEl,
    wrapperEl,
    nodes,
    links,
    degreeById,
    hoveredCell,
    hoveredNodeId,
    labelNames,
    labelTitles,
    valueLabel = "Value",
    width,
    height,
    zoomTransform,
    positionTooltip,
    positionNodeTooltip,
  } = args;
  if (width <= 0 || height <= 0) {
    tooltipEl.style.opacity = "0";
    return;
  }
  const wrapperRect = wrapperEl.getBoundingClientRect();
  const centerX = width / 2;
  const centerY = height / 2;

  if (hoveredCell) {
    const hoveredLink = links.find(
      (link) =>
        (link.rowId === hoveredCell.rowId && link.colId === hoveredCell.colId) ||
        (link.rowId === hoveredCell.colId && link.colId === hoveredCell.rowId),
    );
    if (!hoveredLink) {
      tooltipEl.style.opacity = "0";
      return;
    }
    const source = nodes[hoveredLink.source];
    const target = nodes[hoveredLink.target];
    if (!source || !target) {
      tooltipEl.style.opacity = "0";
      return;
    }
    const [screenX, screenY] = zoomTransform.apply([
      centerX + (source.x + target.x) * 0.25,
      centerY + (source.y + target.y) * 0.25,
    ]);
    const rowLabel = labelNames?.[hoveredLink.rowId] ?? hoveredLink.rowId;
    const colLabel = labelNames?.[hoveredLink.colId] ?? hoveredLink.colId;
    tooltipEl.innerHTML = `<div><strong>${escapeHtml(
      `${rowLabel} ↔ ${colLabel}`,
    )}</strong></div><div>${escapeHtml(valueLabel)}: ${hoveredLink.value.toFixed(4)}</div>`;
    tooltipEl.style.opacity = "1";
    positionTooltip(screenX, screenY, wrapperRect);
    return;
  }

  if (hoveredNodeId) {
    const node = nodes.find((item) => (item.labelId ?? String(item.id)) === hoveredNodeId);
    if (!node) {
      tooltipEl.style.opacity = "0";
      return;
    }
    const labelId = node.labelId ?? String(node.id);
    const degree = degreeById.get(labelId) ?? 0;
    const tooltipLabel = labelTitles?.[labelId] ?? node.label;
    tooltipEl.innerHTML = `<div><strong>${escapeHtml(
      tooltipLabel,
    )}</strong></div><div>Links: ${degree}</div>`;
    tooltipEl.style.opacity = "1";
    positionNodeTooltip(node, wrapperRect);
    return;
  }

  tooltipEl.style.opacity = "0";
};
