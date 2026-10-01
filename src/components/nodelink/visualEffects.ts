import type * as d3 from "d3";

import type { TooltipValueLabel } from "@/components/common/tooltipValueLabel";
import { formatTooltipValue } from "@/components/common/tooltipValueLabel";
import {
  buildRoiTooltipLabel,
} from "@/components/nodelink/nodelinkShared";
import {
  NETWORK_LINK_HOVER_MIN_STROKE,
  NETWORK_LINK_HOVER_STROKE_OFFSET,
  NETWORK_LINK_SELECTED_MIN_STROKE,
  NETWORK_LINK_SELECTED_OPACITY,
  NODE_LINK_LINK_OPACITY,
  NODE_LINK_NODE_HOVER_RADIUS_OFFSET,
  NODE_LINK_ZOOM_RADIUS_OFFSET,
} from "@/config/ui";
import type {
  ClassicLink,
  ClassicNode,
  NetworkLinkColorResolver,
} from "@/types/nodelink";
import type { MatrixVisualStyle } from "@/types/visualizationUi";
import { getReadableTextColor } from "@/utils/groupingColoring";
import { escapeHtml } from "@/utils/html";

type ClassicLinkSelection = d3.Selection<SVGLineElement, ClassicLink, SVGGElement, unknown>;
type ClassicNodeSelection = d3.Selection<SVGCircleElement, ClassicNode, SVGGElement, unknown>;
type ClassicLabelSelection = d3.Selection<SVGTextElement, ClassicNode, SVGGElement, unknown>;

export const applyClassicHoverSelectionStyles = (args: {
  linkSelection: ClassicLinkSelection;
  nodeSelection: ClassicNodeSelection;
  labelSelection: ClassicLabelSelection;
  widthScale: d3.ScaleLinear<number, number>;
  zoomLabelSet: Set<string> | null;
  nodeRadius: number;
  hoveredCell?: { rowId: string; colId: string } | null;
  hoveredNodeId?: string | null;
  selectedLinkIds: Set<string>;
  visualStyle: MatrixVisualStyle;
  linkColorResolver: NetworkLinkColorResolver;
  getNodeColor: (node: ClassicNode) => string;
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
    visualStyle,
    linkColorResolver,
    getNodeColor,
  } = args;

  const hovered = hoveredCell ?? null;
  const hoveredNode = hoveredNodeId ?? null;
  const isHoveredLink = (link: ClassicLink) =>
    hovered
      ? (link.rowId === hovered.rowId && link.colId === hovered.colId) ||
        (link.rowId === hovered.colId && link.colId === hovered.rowId)
      : false;
  const isHoveredNodeLink = (link: ClassicLink) =>
    hoveredNode ? link.rowId === hoveredNode || link.colId === hoveredNode : false;
  const isSelectedLink = (link: ClassicLink) =>
    selectedLinkIds.has(`${link.rowId}::${link.colId}`) ||
    selectedLinkIds.has(`${link.colId}::${link.rowId}`);
  const getBaseLinkOpacity = (link: ClassicLink) =>
    isSelectedLink(link) ? NETWORK_LINK_SELECTED_OPACITY : NODE_LINK_LINK_OPACITY;
  const isSelectedNode = (node: ClassicNode) =>
    node.labelId !== undefined && zoomLabelSet?.has(node.labelId);
  const getDisplayedLinkStrokeColor = (link: ClassicLink) => {
    const annotated = visualStyle.annotationLinkColors?.[`${link.rowId}::${link.colId}`];
    if (annotated) return annotated;
    if ((hovered && isHoveredLink(link)) || (hoveredNode && isHoveredNodeLink(link))) {
      return visualStyle.highlightColor;
    }
    if (isSelectedLink(link)) return visualStyle.selectionColor;
    return linkColorResolver(link.value);
  };

  linkSelection
    .attr("stroke", (link: ClassicLink) => getDisplayedLinkStrokeColor(link))
    .attr("stroke-opacity", (link: ClassicLink) => {
      if ((hovered && isHoveredLink(link)) || (hoveredNode && isHoveredNodeLink(link))) {
        return 1;
      }
      return getBaseLinkOpacity(link);
    })
    .attr("stroke-width", (link: ClassicLink) => {
      const base = widthScale(Math.abs(link.value));
      if ((hovered && isHoveredLink(link)) || (hoveredNode && isHoveredNodeLink(link))) {
        return Math.max(
          base + NETWORK_LINK_HOVER_STROKE_OFFSET,
          NETWORK_LINK_HOVER_MIN_STROKE,
        );
      }
      if (isSelectedLink(link)) return Math.max(base, NETWORK_LINK_SELECTED_MIN_STROKE);
      return base;
    });

  if (hovered) {
    linkSelection.filter((link: ClassicLink) => isHoveredLink(link)).raise();
  }
  if (hoveredNode) {
    linkSelection.filter((link: ClassicLink) => isHoveredNodeLink(link)).raise();
  }
  linkSelection.filter((link: ClassicLink) => isSelectedLink(link)).raise();

  nodeSelection
    .attr("r", (node: ClassicNode) => {
      const isZoom = node.labelId !== undefined && zoomLabelSet?.has(node.labelId);
      const labelId = node.labelId ?? String(node.id);
      const isHover = hoveredNode === labelId;
      let radius = nodeRadius + (isZoom ? NODE_LINK_ZOOM_RADIUS_OFFSET : 0);
      if (isHover) radius += NODE_LINK_NODE_HOVER_RADIUS_OFFSET;
      return radius;
    })
    .attr("fill", (node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      if (visualStyle.annotationNodeColors?.[labelId]) return visualStyle.annotationNodeColors[labelId];
      if (hoveredNode === labelId) return visualStyle.highlightColor;
      if (isSelectedNode(node)) return visualStyle.selectionColor;
      return getNodeColor(node);
    })
    .attr("stroke", (node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      return hoveredNode === labelId ? visualStyle.highlightColor : "none";
    })
    .attr("stroke-width", (node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      return hoveredNode === labelId ? 1.2 : 0;
    });

  labelSelection
    .attr("fill", (node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      if (visualStyle.annotationNodeColors?.[labelId]) return visualStyle.annotationNodeColors[labelId];
      if (hoveredNode === labelId) return visualStyle.highlightColor;
      if (isSelectedNode(node)) return getReadableTextColor(visualStyle.selectionColor);
      return "#394b59";
    })
    .attr("font-weight", (node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      if (hoveredNode === labelId) return 700;
      return isSelectedNode(node) ? 700 : 400;
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
  valueLabel?: TooltipValueLabel;
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
    )}</strong></div>${formatTooltipValue(valueLabel, hoveredLink.value, hoveredLink.rowId, hoveredLink.colId)}`;
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
