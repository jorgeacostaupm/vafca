import * as d3 from "d3";

import {
  CIRCULAR_LABEL_DY,
  CIRCULAR_LABEL_FONT_SIZE,
  CIRCULAR_LABEL_OFFSET,
  CIRCULAR_LABEL_SELECTION_BACKGROUND_PADDING_X,
  CIRCULAR_LABEL_SELECTION_BACKGROUND_PADDING_Y,
  CIRCULAR_LABEL_SELECTION_BACKGROUND_RADIUS,
  CIRCULAR_LINK_OPACITY,
  NETWORK_LINK_SELECTED_MIN_STROKE,
  NETWORK_LINK_SELECTED_OPACITY,
} from "@/config/ui";
import {
  type CircularBundlePathPoint,
  DEFAULT_CIRCULAR_LINK_TENSION,
} from "@/types/circular";
import type {
  CircularLink,
  CircularNode,
  NetworkLinkColorResolver,
} from "@/types/nodelink";
import type { MatrixVisualStyle } from "@/types/visualizationUi";
import { getReadableTextColor } from "@/utils/groupingColoring";
import { escapeHtml } from "@/utils/html";

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

const getCircularNodeLabelId = (node: CircularNode) =>
  node.labelId ?? String(node.id);

const isCircularNodeSelected = (
  node: CircularNode,
  zoomLabelSet: Set<string> | null,
) => node.labelId !== undefined && zoomLabelSet?.has(node.labelId);

const resolveCircularLabelFill = ({
  node,
  zoomLabelSet,
  selectedColor,
}: {
  node: CircularNode;
  zoomLabelSet: Set<string> | null;
  selectedColor: string;
}) => {
  if (isCircularNodeSelected(node, zoomLabelSet)) {
    return getReadableTextColor(selectedColor);
  }

  return "#394b59";
};

const applyCircularLabelSelectionBackground = (
  labelGroups: d3.Selection<SVGGElement, CircularNode, SVGGElement, unknown>,
  zoomLabelSet: Set<string> | null,
  selectionColor: string,
) => {
  labelGroups.each(function (node) {
    const textNode = d3.select(this).select<SVGTextElement>("text").node();
    const rect = d3.select(this).select<SVGRectElement>("rect");
    const isSelected = isCircularNodeSelected(node, zoomLabelSet);

    if (!textNode || !isSelected) {
      rect
        .attr("fill", "transparent")
        .attr("stroke", "none")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 0)
        .attr("height", 0);
      return;
    }

    const box = textNode.getBBox();

    rect
      .attr("fill", selectionColor)
      .attr("stroke", "none")
      .attr("x", box.x - CIRCULAR_LABEL_SELECTION_BACKGROUND_PADDING_X)
      .attr("y", box.y - CIRCULAR_LABEL_SELECTION_BACKGROUND_PADDING_Y)
      .attr(
        "width",
        box.width + CIRCULAR_LABEL_SELECTION_BACKGROUND_PADDING_X * 2,
      )
      .attr(
        "height",
        box.height + CIRCULAR_LABEL_SELECTION_BACKGROUND_PADDING_Y * 2,
      );
  });
};

type RenderCircularElementsArgs = {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  nodes: CircularNode[];
  links: CircularLink[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  selectedLinkIds: Set<string>;
  visualStyle: MatrixVisualStyle;
  linkColorResolver: NetworkLinkColorResolver;
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
  labelNames,
  labelTitles,
  selectedLinkIds,
  visualStyle,
  linkColorResolver,
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
  const linkOpacity = (link: CircularLink) =>
    isSelectedLink(link) ? NETWORK_LINK_SELECTED_OPACITY : CIRCULAR_LINK_OPACITY;
  const linkStrokeWidth = (link: CircularLink) => {
    const base = widthScale(Math.abs(link.value));
    return isSelectedLink(link) ? Math.max(base, NETWORK_LINK_SELECTED_MIN_STROKE) : base;
  };
  const showNodeInteractionTooltip = (node: CircularNode) => {
    const labelId = getCircularNodeLabelId(node);
    const degree = degreeById.get(labelId) ?? 0;
    showNodeTooltip(
      buildCircularNodeTooltipHtml({ node, degree, labelTitles }),
      node,
    );
  };
  const handleNodeMouseEnter = (_event: MouseEvent, node: CircularNode) => {
    const labelId = getCircularNodeLabelId(node);
    showNodeInteractionTooltip(node);
    onNodeHover?.(labelId);
  };
  const handleNodeMouseMove = (_event: MouseEvent, node: CircularNode) => {
    showNodeInteractionTooltip(node);
  };
  const handleNodeMouseLeave = () => {
    hideTooltip();
    onNodeLeave?.();
  };
  const handleNodeClick = (event: MouseEvent, node: CircularNode) => {
    if (!onLabelToggle || !node.labelId) return;
    event.stopPropagation();
    onLabelToggle(node.labelId);
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
      const controlX = ((source.x + target.x) / 2) * (1 - circularLinkTension);
      const controlY = ((source.y + target.y) / 2) * (1 - circularLinkTension);
      const path = d3.path();
      path.moveTo(source.x, source.y);
      path.quadraticCurveTo(controlX, controlY, target.x, target.y);
      return path.toString();
    })
    .attr("fill", "none")
    .attr("stroke", (link: CircularLink) =>
      isSelectedLink(link)
        ? visualStyle.selectionColor
        : linkColorResolver(link.value),
    )
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
      setLocalHoverActive(true);
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
      setLocalHoverActive(false);
      onLinkLeave?.();
    });
  linkSelection.filter((link: CircularLink) => isSelectedLink(link)).raise();

  const nodeSelection = root
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("cx", (node: CircularNode) => node.x)
    .attr("cy", (node: CircularNode) => node.y)
    .attr("r", nodeRadius)
    .attr("fill", (node: CircularNode) =>
      isCircularNodeSelected(node, zoomLabelSet)
        ? visualStyle.selectionColor
        : getNodeColor(node),
    )
    .style("cursor", "pointer")
    .on("mouseenter", handleNodeMouseEnter)
    .on("mousemove", handleNodeMouseMove)
    .on("mouseleave", handleNodeMouseLeave)
    .on("click", handleNodeClick);

  const labelGroups = root
    .append("g")
    .selectAll<SVGGElement, CircularNode>("g")
    .data(nodes)
    .join("g")
    .attr("transform", (node: CircularNode) => {
      const angle = (node.angle * 180) / Math.PI;
      const normalizedAngle = ((angle % 360) + 360) % 360;
      const shouldFlip = normalizedAngle > 90 && normalizedAngle < 270;
      const rotation = shouldFlip ? angle + 180 : angle;
      return `translate(${node.x}, ${node.y}) rotate(${rotation})`;
    })
    .style("cursor", onLabelToggle ? "pointer" : "default")
    .on("mouseenter", handleNodeMouseEnter)
    .on("mousemove", handleNodeMouseMove)
    .on("mouseleave", handleNodeMouseLeave)
    .on("click", handleNodeClick);

  labelGroups
    .selectAll("rect")
    .data((node) => [node])
    .join("rect")
    .attr("rx", CIRCULAR_LABEL_SELECTION_BACKGROUND_RADIUS)
    .attr("ry", CIRCULAR_LABEL_SELECTION_BACKGROUND_RADIUS);

  const labelSelection = labelGroups
    .selectAll<SVGTextElement, CircularNode>("text")
    .data((node) => [node])
    .join("text")
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
      resolveCircularLabelFill({
        node,
        zoomLabelSet,
        selectedColor: visualStyle.selectionColor,
      }),
    )
    .attr("font-weight", (node: CircularNode) =>
      isCircularNodeSelected(node, zoomLabelSet) ? 700 : 400,
    )
    .text((node: CircularNode) => node.label);

  applyCircularLabelSelectionBackground(
    labelGroups,
    zoomLabelSet,
    visualStyle.selectionColor,
  );

  return { linkSelection, nodeSelection, labelSelection };
};
