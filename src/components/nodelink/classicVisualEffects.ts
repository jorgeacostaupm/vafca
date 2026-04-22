import { escapeHtml } from "@/utils/html";
import { buildRoiTooltipLabel, SELECTED_STROKE } from "@/components/nodelink/nodelinkShared";
import type { ClassicLink, ClassicNode } from "@/components/nodelink/classicRenderStrategies";

export const applyClassicHoverSelectionStyles = (args: {
  linkSelection: any;
  nodeSelection: any;
  labelSelection: any;
  widthScale: any;
  zoomLabelSet: Set<string> | null;
  nodeRadius: number;
  hoveredCell?: { rowId: string; colId: string } | null;
  hoveredNodeId?: string | null;
  selectedLinkIds: Set<string>;
  getNodeColor: (node: ClassicNode) => string;
  hoverNodeColor: string;
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
    hoverNodeColor,
  } = args;

  const hovered = hoveredCell ?? null;
  const hoveredNode = hoveredNodeId ?? null;
  const isHoveredLink = (link: ClassicLink) =>
    hovered
      ? (link.rowId === hovered.rowId && link.colId === hovered.colId) ||
        (link.rowId === hovered.colId && link.colId === hovered.rowId)
      : false;
  const isSelectedLink = (link: ClassicLink) =>
    selectedLinkIds.has(`${link.rowId}::${link.colId}`) ||
    selectedLinkIds.has(`${link.colId}::${link.rowId}`);

  linkSelection
    .attr("stroke-opacity", (link: ClassicLink) => {
      if (hovered) {
        if (isHoveredLink(link)) return 1;
        return isSelectedLink(link) ? 0.65 : 0.2;
      }
      return isSelectedLink(link) ? 0.9 : 0.55;
    })
    .attr("stroke-width", (link: ClassicLink) => {
      const base = widthScale(Math.abs(link.value));
      if (hovered && isHoveredLink(link)) return Math.max(base + 0.8, SELECTED_STROKE);
      if (isSelectedLink(link)) return Math.max(base, SELECTED_STROKE);
      return base;
    });

  nodeSelection
    .attr("r", (node: ClassicNode) => {
      const isZoom = node.labelId !== undefined && zoomLabelSet?.has(node.labelId);
      const labelId = node.labelId ?? String(node.id);
      const isHover = hoveredNode === labelId;
      let radius = nodeRadius + (isZoom ? 1.5 : 0);
      if (isHover) radius += 2.5;
      return radius;
    })
    .attr("fill", (node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      if (hoveredNode === labelId) return hoverNodeColor;
      return getNodeColor(node);
    })
    .attr("stroke", (node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      return hoveredNode === labelId ? hoverNodeColor : "none";
    })
    .attr("stroke-width", (node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      return hoveredNode === labelId ? 1.2 : 0;
    });

  labelSelection
    .attr("fill", (node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      if (hoveredNode === labelId) return hoverNodeColor;
      return node.labelId !== undefined && zoomLabelSet?.has(node.labelId)
        ? "#1b2b38"
        : "#394b59";
    })
    .attr("font-weight", (node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      if (hoveredNode === labelId) return 700;
      return node.labelId !== undefined && zoomLabelSet?.has(node.labelId) ? 700 : 400;
    });
};

export const syncClassicProgrammaticTooltip = (args: {
  tooltipEl: HTMLDivElement;
  wrapperEl: HTMLDivElement;
  nodes: ClassicNode[];
  links: ClassicLink[];
  degreeById: Map<string, number>;
  hoveredCell?: { rowId: string; colId: string } | null;
  hoveredNodeId?: string | null;
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  valueLabel?: string;
  width: number;
  height: number;
  defaultMargin: number;
  zoomTransform: { apply: (xy: [number, number]) => [number, number] };
  positionTooltip: (x: number, y: number, wrapperRect: DOMRect) => void;
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
    labelAcronyms,
    valueLabel = "Value",
    width,
    height,
    defaultMargin,
    zoomTransform,
    positionTooltip,
  } = args;

  if (width <= 0 || height <= 0 || !nodes || !links || !degreeById) {
    tooltipEl.style.opacity = "0";
    return;
  }

  const clampX = (value: number | undefined) =>
    Math.max(defaultMargin, Math.min(width - defaultMargin, value ?? width / 2));
  const clampY = (value: number | undefined) =>
    Math.max(defaultMargin, Math.min(height - defaultMargin, value ?? height / 2));
  const wrapperRect = wrapperEl.getBoundingClientRect();

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
    const source =
      typeof hoveredLink.source === "number"
        ? nodes[hoveredLink.source]
        : hoveredLink.source;
    const target =
      typeof hoveredLink.target === "number"
        ? nodes[hoveredLink.target]
        : hoveredLink.target;
    if (!source || !target) {
      tooltipEl.style.opacity = "0";
      return;
    }
    const sx = clampX(source.x);
    const sy = clampY(source.y);
    const tx = clampX(target.x);
    const ty = clampY(target.y);
    const [screenX, screenY] = zoomTransform.apply([(sx + tx) / 2, (sy + ty) / 2]);
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
    const tooltipLabel = buildRoiTooltipLabel(
      labelTitles?.[labelId] ?? node.label,
      labelAcronyms?.[labelId] ?? labelId,
    );
    const [screenX, screenY] = zoomTransform.apply([clampX(node.x), clampY(node.y)]);
    tooltipEl.innerHTML = `<div><strong>${escapeHtml(
      tooltipLabel,
    )}</strong></div><div>Links: ${degree}</div>`;
    tooltipEl.style.opacity = "1";
    positionTooltip(screenX, screenY, wrapperRect);
    return;
  }

  tooltipEl.style.opacity = "0";
};
