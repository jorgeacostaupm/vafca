import * as d3 from "d3";
import { escapeHtml } from "@/utils/html";
import {
  NODE_LINK_LABEL_DY,
  NODE_LINK_LABEL_FONT_SIZE,
  NODE_LINK_LABEL_OFFSET,
  NODE_LINK_ZOOM_RADIUS_OFFSET,
} from "@/config/ui";
import type { ClassicLink, ClassicNode } from "@/types/nodelink";
import {
  buildRoiTooltipLabel,
  LINK_COLOR,
  LINK_NEGATIVE,
  LINK_POSITIVE,
  SELECTED_STROKE,
} from "@/components/nodelink/nodelinkShared";
import {
  configureDraggableNodes,
  syncNodeLinkPositions,
} from "@/components/nodelink/draggableNodes";


type RenderClassicElementsArgs = {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  simNodes: ClassicNode[];
  simLinks: ClassicLink[];
  width: number;
  height: number;
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
  getNodeColor: (node: ClassicNode) => string;
  valueLabel?: string;
  showTooltip: (html: string, event: MouseEvent | PointerEvent) => void;
  moveTooltip: (event: MouseEvent | PointerEvent) => void;
  hideTooltip: () => void;
  setLocalHoverActive: (active: boolean) => void;
  clampX: (value: number | undefined) => number;
  clampY: (value: number | undefined) => number;
  defaultMargin: number;
};

export const renderClassicElements = ({
  root,
  simNodes,
  simLinks,
  width,
  height,
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
  clampX,
  clampY,
  defaultMargin,
}: RenderClassicElementsArgs) => {
  const isSelectedLink = (link: ClassicLink) =>
    selectedLinkIds.has(`${link.rowId}::${link.colId}`) ||
    selectedLinkIds.has(`${link.colId}::${link.rowId}`);
  const linkOpacity = (link: ClassicLink) => (isSelectedLink(link) ? 0.9 : 0.55);
  const linkStrokeWidth = (link: ClassicLink) => {
    const base = widthScale(Math.abs(link.value));
    return isSelectedLink(link) ? Math.max(base, SELECTED_STROKE) : base;
  };

  const linkGroup = root.append("g");
  const linkSelection = linkGroup
    .selectAll<SVGLineElement, ClassicLink>("line")
    .data(simLinks)
    .join("line")
    .attr("x1", (link: ClassicLink) => {
      const source =
        typeof link.source === "number" ? simNodes[link.source] : link.source;
      return clampX(source?.x);
    })
    .attr("y1", (link: ClassicLink) => {
      const source =
        typeof link.source === "number" ? simNodes[link.source] : link.source;
      return clampY(source?.y);
    })
    .attr("x2", (link: ClassicLink) => {
      const target =
        typeof link.target === "number" ? simNodes[link.target] : link.target;
      return clampX(target?.x);
    })
    .attr("y2", (link: ClassicLink) => {
      const target =
        typeof link.target === "number" ? simNodes[link.target] : link.target;
      return clampY(target?.y);
    })
    .attr("stroke", (link: ClassicLink) => {
      if (!diverging) return LINK_COLOR;
      return link.value >= 0 ? LINK_POSITIVE : LINK_NEGATIVE;
    })
    .attr("stroke-opacity", (link: ClassicLink) => linkOpacity(link))
    .attr("stroke-width", (link: ClassicLink) => linkStrokeWidth(link))
    .style("cursor", "pointer")
    .on("click", (event: MouseEvent, link: ClassicLink) => {
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
    .on("mouseenter", (event: MouseEvent, link: ClassicLink) => {
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

  const nodeGroup = root.append("g");
  const nodeSelection = nodeGroup
    .selectAll<SVGCircleElement, ClassicNode>("circle")
    .data(simNodes)
    .join("circle")
    .attr("cx", (node: ClassicNode) => clampX(node.x))
    .attr("cy", (node: ClassicNode) => clampY(node.y))
    .attr("r", (node: ClassicNode) =>
      node.labelId && zoomLabelSet?.has(node.labelId)
        ? nodeRadius + NODE_LINK_ZOOM_RADIUS_OFFSET
        : nodeRadius,
    )
    .attr("fill", (node: ClassicNode) => getNodeColor(node))
    .style("cursor", "pointer")
    .on("mouseenter", (event: MouseEvent, node: ClassicNode) => {
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

  const labelGroup = root.append("g");
  const labelSelection = labelGroup
    .selectAll<SVGTextElement, ClassicNode>("text")
    .data(simNodes)
    .join("text")
    .attr("x", (node: ClassicNode) => clampX(node.x))
    .attr("y", (node: ClassicNode) => clampY(node.y))
    .attr("dx", (node: ClassicNode) =>
      (node.x ?? 0) >= width / 2 ? NODE_LINK_LABEL_OFFSET : -NODE_LINK_LABEL_OFFSET,
    )
    .attr("dy", NODE_LINK_LABEL_DY)
    .attr("text-anchor", (node: ClassicNode) =>
      (node.x ?? 0) >= width / 2 ? "start" : "end",
    )
    .attr("font-size", NODE_LINK_LABEL_FONT_SIZE)
    .attr("fill", (node: ClassicNode) =>
      node.labelId && zoomLabelSet?.has(node.labelId) ? "#1b2b38" : "#394b59",
    )
    .attr("font-weight", (node: ClassicNode) =>
      node.labelId && zoomLabelSet?.has(node.labelId) ? 700 : 400,
    )
    .style("cursor", onLabelToggle ? "pointer" : "default")
    .text((node: ClassicNode) => node.label)
    .on("mouseenter", (_event: MouseEvent, node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      setLocalHoverActive(true);
      onNodeHover?.(labelId);
    })
    .on("mouseleave", () => {
      setLocalHoverActive(false);
      onNodeLeave?.();
    })
    .on("click", (event: MouseEvent, node: ClassicNode) => {
      if (!onLabelToggle || !node.labelId) return;
      event.stopPropagation();
      onLabelToggle(node.labelId);
    });

  syncNodeLinkPositions({
    linkSelection,
    nodeSelection,
    labelSelection,
    simNodes,
    width,
    height,
    defaultMargin,
    clampX,
    clampY,
  });

  configureDraggableNodes({
    linkSelection,
    nodeSelection,
    labelSelection,
    simNodes,
    simLinks,
    width,
    height,
    defaultMargin,
    clampX,
    clampY,
    hideTooltip,
  });

  return { linkSelection, nodeSelection, labelSelection };
};
