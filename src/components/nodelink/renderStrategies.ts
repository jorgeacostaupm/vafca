import * as d3 from "d3";

import type { TooltipValueLabel } from "@/components/common/tooltipValueLabel";
import { formatTooltipValue } from "@/components/common/tooltipValueLabel";
import {
  configureDraggableNodes,
  syncNodeLinkPositions,
} from "@/components/nodelink/draggableNodes";
import {
  buildRoiTooltipLabel,
} from "@/components/nodelink/nodelinkShared";
import {
  NETWORK_LINK_SELECTED_MIN_STROKE,
  NETWORK_LINK_SELECTED_OPACITY,
  NODE_LINK_HIT_STROKE_WIDTH,
  NODE_LINK_LABEL_DY,
  NODE_LINK_LABEL_FONT_SIZE,
  NODE_LINK_LABEL_OFFSET,
  NODE_LINK_LABEL_SELECTION_BACKGROUND_RADIUS,
  NODE_LINK_LINK_OPACITY,
  NODE_LINK_ZOOM_RADIUS_OFFSET,
} from "@/config/ui";
import type { ClassicLink, ClassicNode } from "@/types/nodelink";
import type { NetworkLinkColorResolver } from "@/types/nodelink";
import type {
  MatrixVisualStyle,
} from "@/types/visualizationUi";
import { getReadableTextColor } from "@/utils/groupingColoring";
import { escapeHtml } from "@/utils/html";

type RenderClassicElementsArgs = {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  simNodes: ClassicNode[];
  simLinks: ClassicLink[];
  width: number;
  height: number;
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  selectedLinkIds: Set<string>;
  visualStyle: MatrixVisualStyle;
  linkColorResolver: NetworkLinkColorResolver;
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
  valueLabel?: TooltipValueLabel;
  showTooltip: (html: string, event: MouseEvent | PointerEvent) => void;
  moveTooltip: (event: MouseEvent | PointerEvent) => void;
  hideTooltip: () => void;
  setLocalHoverActive: (active: boolean) => void;
  clampX: (value: number | undefined) => number;
  clampY: (value: number | undefined) => number;
  defaultMargin: number;
};

const getClassicNodeLabelId = (node: ClassicNode) => node.labelId ?? String(node.id);

const isClassicNodeSelected = (
  node: ClassicNode,
  zoomLabelSet: Set<string> | null,
) => node.labelId !== undefined && zoomLabelSet?.has(node.labelId);

const buildClassicNodeTooltipHtml = ({
  node,
  degree,
  labelTitles,
  labelAcronyms,
}: {
  node: ClassicNode;
  degree: number;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
}) => {
  const labelId = getClassicNodeLabelId(node);
  const tooltipLabel = buildRoiTooltipLabel(
    labelTitles?.[labelId] ?? node.label,
    labelAcronyms?.[labelId] ?? labelId,
  );

  return `<div><strong>${escapeHtml(
    tooltipLabel,
  )}</strong></div><div>Links: ${degree}</div>`;
};

export const renderClassicElements = ({
  root,
  simNodes,
  simLinks,
  width,
  height,
  labelNames,
  labelTitles,
  labelAcronyms,
  selectedLinkIds,
  visualStyle,
  linkColorResolver,
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
  const linkOpacity = (link: ClassicLink) =>
    isSelectedLink(link) ? NETWORK_LINK_SELECTED_OPACITY : NODE_LINK_LINK_OPACITY;
  const linkStrokeWidth = (link: ClassicLink) => {
    const base = widthScale(Math.abs(link.value));
    return isSelectedLink(link) ? Math.max(base, NETWORK_LINK_SELECTED_MIN_STROKE) : base;
  };
  const showNodeTooltipForInteraction = (
    event: MouseEvent | PointerEvent,
    node: ClassicNode,
  ) => {
    const labelId = getClassicNodeLabelId(node);
    const degree = degreeById.get(labelId) ?? 0;
    showTooltip(
      buildClassicNodeTooltipHtml({ node, degree, labelTitles, labelAcronyms }),
      event,
    );
  };
  const handleNodeMouseEnter = (event: MouseEvent, node: ClassicNode) => {
    const labelId = getClassicNodeLabelId(node);
    showNodeTooltipForInteraction(event, node);
    onNodeHover?.(labelId);
  };
  const handleNodeMouseMove = (event: MouseEvent, node: ClassicNode) => {
    showNodeTooltipForInteraction(event, node);
  };
  const handleNodeMouseLeave = () => {
    hideTooltip();
    onNodeLeave?.();
  };
  const handleNodeClick = (event: MouseEvent, node: ClassicNode) => {
    if (!onLabelToggle || !node.labelId) return;
    event.stopPropagation();
    onLabelToggle(node.labelId);
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
    .attr("stroke", (link: ClassicLink) =>
      isSelectedLink(link)
        ? visualStyle.selectionColor
        : linkColorResolver(link.value),
    )
    .attr("stroke-opacity", (link: ClassicLink) => linkOpacity(link))
    .attr("stroke-width", (link: ClassicLink) => linkStrokeWidth(link))
    .style("pointer-events", "none");

  const linkHitSelection = root
    .append("g")
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
    .attr("stroke", "transparent")
    .attr("stroke-width", NODE_LINK_HIT_STROKE_WIDTH)
    .attr("stroke-linecap", "round")
    .style("cursor", "pointer")
    .style("pointer-events", "stroke")
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
      setLocalHoverActive(true);
      showTooltip(
        `<div><strong>${escapeHtml(
          `${rowLabel} ↔ ${colLabel}`,
        )}</strong></div>${formatTooltipValue(valueLabel, link.value, link.rowId, link.colId)}`,
        event,
      );
      onLinkHover?.({ rowId: link.rowId, colId: link.colId });
    })
    .on("mousemove", (event: MouseEvent) => moveTooltip(event))
    .on("mouseleave", () => {
      hideTooltip();
      setLocalHoverActive(false);
      onLinkLeave?.();
    });
  linkSelection.filter((link: ClassicLink) => isSelectedLink(link)).raise();

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
    .attr("fill", (node: ClassicNode) =>
      isClassicNodeSelected(node, zoomLabelSet)
        ? visualStyle.selectionColor
        : getNodeColor(node),
    )
    .style("cursor", "pointer")
    .on("mouseenter", handleNodeMouseEnter)
    .on("mousemove", handleNodeMouseMove)
    .on("mouseleave", handleNodeMouseLeave)
    .on("click", handleNodeClick);

  const labelGroup = root.append("g");
  const labelBackgroundSelection = labelGroup
    .selectAll<SVGRectElement, ClassicNode>("rect")
    .data(simNodes)
    .join("rect")
    .attr("rx", NODE_LINK_LABEL_SELECTION_BACKGROUND_RADIUS)
    .attr("ry", NODE_LINK_LABEL_SELECTION_BACKGROUND_RADIUS)
    .attr("fill", (node: ClassicNode) =>
      isClassicNodeSelected(node, zoomLabelSet)
        ? visualStyle.selectionColor
        : "transparent",
    )
    .attr("stroke", "none")
    .style("pointer-events", "none");

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
      isClassicNodeSelected(node, zoomLabelSet)
        ? getReadableTextColor(visualStyle.selectionColor)
        : "#394b59",
    )
    .attr("font-weight", (node: ClassicNode) =>
      isClassicNodeSelected(node, zoomLabelSet) ? 700 : 400,
    )
    .style("cursor", onLabelToggle ? "pointer" : "default")
    .text((node: ClassicNode) => node.label)
    .on("mouseenter", handleNodeMouseEnter)
    .on("mousemove", handleNodeMouseMove)
    .on("mouseleave", handleNodeMouseLeave)
    .on("click", handleNodeClick);

  syncNodeLinkPositions({
    linkSelection,
    linkHitSelection,
    nodeSelection,
    labelSelection,
    labelBackgroundSelection,
    simNodes,
    width,
    height,
    defaultMargin,
    clampX,
    clampY,
  });

  configureDraggableNodes({
    linkSelection,
    linkHitSelection,
    nodeSelection,
    labelSelection,
    labelBackgroundSelection,
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
