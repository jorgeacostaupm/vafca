import * as d3 from "d3";
import {
  NODE_LINK_LAYOUT_MAX_LINK_DISTANCE,
  NODE_LINK_LAYOUT_MIN_LINK_DISTANCE,
  NODE_LINK_LABEL_DY,
  NODE_LINK_LABEL_OFFSET,
} from "@/config/ui";
import type { ClassicLink, ClassicNode } from "@/types/nodelink";

type LinkSelection = d3.Selection<SVGLineElement, ClassicLink, SVGGElement, unknown>;
type NodeSelection = d3.Selection<SVGCircleElement, ClassicNode, SVGGElement, unknown>;
type LabelSelection = d3.Selection<SVGTextElement, ClassicNode, SVGGElement, unknown>;

type ConfigureDraggableNodesArgs = {
  linkSelection: LinkSelection;
  nodeSelection: NodeSelection;
  labelSelection: LabelSelection;
  simNodes: ClassicNode[];
  simLinks: ClassicLink[];
  width: number;
  height: number;
  defaultMargin: number;
  clampX: (value: number | undefined) => number;
  clampY: (value: number | undefined) => number;
  hideTooltip: () => void;
};

type SyncNodeLinkPositionsArgs = Omit<
  ConfigureDraggableNodesArgs,
  "hideTooltip" | "simLinks"
>;

const getGraphDensity = (nodeCount: number, linkCount: number) => {
  if (nodeCount < 2) return 0;
  return linkCount / ((nodeCount * (nodeCount - 1)) / 2);
};

const getInteractiveLinkDistance = (args: {
  width: number;
  height: number;
  nodeCount: number;
  density: number;
}) => {
  const { width, height, nodeCount, density } = args;
  const minDim = Math.min(width, height);
  const distance = (minDim / Math.max(3, Math.sqrt(nodeCount))) * (1 - Math.min(0.35, density * 0.3));
  return Math.max(
    NODE_LINK_LAYOUT_MIN_LINK_DISTANCE,
    Math.min(NODE_LINK_LAYOUT_MAX_LINK_DISTANCE, distance),
  );
};

const getEndpointNode = (
  link: ClassicLink,
  endpoint: "source" | "target",
  simNodes: ClassicNode[],
) => {
  const endpointValue = link[endpoint];
  return typeof endpointValue === "number" ? simNodes[endpointValue] : endpointValue;
};

const buildIncidentLinksByNodeId = (links: ClassicLink[], simNodes: ClassicNode[]) => {
  const incidentLinksById = new Map<number, ClassicLink[]>();
  links.forEach((link) => {
    const source = getEndpointNode(link, "source", simNodes);
    const target = getEndpointNode(link, "target", simNodes);
    if (!source || !target) return;

    const sourceLinks = incidentLinksById.get(source.id) ?? [];
    sourceLinks.push(link);
    incidentLinksById.set(source.id, sourceLinks);

    const targetLinks = incidentLinksById.get(target.id) ?? [];
    targetLinks.push(link);
    incidentLinksById.set(target.id, targetLinks);
  });
  return incidentLinksById;
};

const pullConnectedNodesTowardDraggedNode = (args: {
  draggedNode: ClassicNode;
  incidentLinks: ClassicLink[];
  simNodes: ClassicNode[];
  maxDistance: number;
}) => {
  const { draggedNode, incidentLinks, simNodes, maxDistance } = args;
  const draggedX = draggedNode.x ?? draggedNode.fx ?? 0;
  const draggedY = draggedNode.y ?? draggedNode.fy ?? 0;

  incidentLinks.forEach((link) => {
    const source = getEndpointNode(link, "source", simNodes);
    const target = getEndpointNode(link, "target", simNodes);
    const neighbor = source?.id === draggedNode.id ? target : source;
    if (!neighbor || neighbor.fx != null || neighbor.fy != null) return;

    const neighborX = neighbor.x ?? draggedX;
    const neighborY = neighbor.y ?? draggedY;
    const dx = draggedX - neighborX;
    const dy = draggedY - neighborY;
    const distance = Math.hypot(dx, dy);
    if (distance <= maxDistance) return;

    const overshoot = distance - maxDistance;
    const pull = Math.min(0.45, overshoot / Math.max(distance, 1));
    neighbor.vx = (neighbor.vx ?? 0) + dx * pull;
    neighbor.vy = (neighbor.vy ?? 0) + dy * pull;
  });
};

const syncLinkPositions = (args: {
  linkSelection: LinkSelection;
  simNodes: ClassicNode[];
  clampX: (value: number | undefined) => number;
  clampY: (value: number | undefined) => number;
}) => {
  const { linkSelection, simNodes, clampX, clampY } = args;
  linkSelection
    .attr("x1", (link) => clampX(getEndpointNode(link, "source", simNodes)?.x))
    .attr("y1", (link) => clampY(getEndpointNode(link, "source", simNodes)?.y))
    .attr("x2", (link) => clampX(getEndpointNode(link, "target", simNodes)?.x))
    .attr("y2", (link) => clampY(getEndpointNode(link, "target", simNodes)?.y));
};

const syncLabelPositions = (args: {
  labelSelection: LabelSelection;
  width: number;
  height: number;
  defaultMargin: number;
  clampX: (value: number | undefined) => number;
  clampY: (value: number | undefined) => number;
}) => {
  const { labelSelection, width, height, defaultMargin, clampX, clampY } = args;
  labelSelection
    .attr("x", (node) => clampX(node.x))
    .attr("y", (node) => clampY(node.y))
    .attr("dx", (node) =>
      (node.x ?? 0) >= width / 2 ? NODE_LINK_LABEL_OFFSET : -NODE_LINK_LABEL_OFFSET,
    )
    .attr("dy", NODE_LINK_LABEL_DY)
    .attr("text-anchor", (node) => ((node.x ?? 0) >= width / 2 ? "start" : "end"));

  labelSelection.each(function () {
    const text = d3.select(this);
    const anchor = text.attr("text-anchor");
    const dx = Number(text.attr("dx")) || 0;
    const dy = Number(text.attr("dy")) || 0;
    let x = Number(text.attr("x")) || 0;
    let y = Number(text.attr("y")) || 0;
    const textWidth = (this as SVGTextElement).getComputedTextLength();

    const minY = defaultMargin - dy;
    const maxY = Math.max(minY, height - defaultMargin - dy);
    y = Math.min(Math.max(y, minY), maxY);

    if (anchor === "start") {
      const minX = defaultMargin;
      const maxX = Math.max(minX, width - defaultMargin - textWidth - dx);
      x = Math.min(Math.max(x, minX), maxX);
    } else {
      const minX = defaultMargin + textWidth - dx;
      const maxX = width - defaultMargin;
      const safeMin = Math.min(minX, maxX);
      x = Math.min(Math.max(x, safeMin), maxX);
    }
    text.attr("x", x).attr("y", y);
  });
};

export const syncNodeLinkPositions = (args: SyncNodeLinkPositionsArgs) => {
  const {
    linkSelection,
    nodeSelection,
    labelSelection,
    simNodes,
    width,
    height,
    defaultMargin,
    clampX,
    clampY,
  } = args;

  syncLinkPositions({ linkSelection, simNodes, clampX, clampY });
  nodeSelection.attr("cx", (node) => clampX(node.x)).attr("cy", (node) => clampY(node.y));
  syncLabelPositions({ labelSelection, width, height, defaultMargin, clampX, clampY });
};

export const configureDraggableNodes = ({
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
}: ConfigureDraggableNodesArgs) => {
  const density = getGraphDensity(simNodes.length, simLinks.length);
  const linkDistance = getInteractiveLinkDistance({
    width,
    height,
    nodeCount: simNodes.length,
    density,
  });
  const maxInteractiveLinkDistance = linkDistance * 1.45;
  const incidentLinksByNodeId = buildIncidentLinksByNodeId(simLinks, simNodes);
  const syncPositions = () =>
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
  const simulation = d3
    .forceSimulation<ClassicNode>(simNodes)
    .force(
      "link",
      d3
        .forceLink<ClassicNode, ClassicLink>(simLinks)
        .id((node) => node.id)
        .distance(linkDistance)
        .strength(Math.max(0.25, 0.85 - density * 0.45)),
    )
    .force("charge", d3.forceManyBody().strength(-Math.max(50, linkDistance * 1.8)))
    .force("collision", d3.forceCollide(Math.max(10, linkDistance / 5)).iterations(2))
    .force("x", d3.forceX(width / 2).strength(0.015))
    .force("y", d3.forceY(height / 2).strength(0.015))
    .alpha(0)
    .stop()
    .on("tick", syncPositions);

  const drag = d3
    .drag<SVGCircleElement, ClassicNode>()
    .filter((event) => event.button === 0)
    .on("start", (event, node) => {
      event.sourceEvent?.stopPropagation();
      hideTooltip();
      node.fx = clampX(node.x);
      node.fy = clampY(node.y);
      simulation.alphaTarget(0.32).restart();
    })
    .on("drag", (event, node) => {
      event.sourceEvent?.stopPropagation();
      node.fx = clampX(event.x);
      node.fy = clampY(event.y);
      node.x = node.fx;
      node.y = node.fy;
      node.vx = 0;
      node.vy = 0;

      pullConnectedNodesTowardDraggedNode({
        draggedNode: node,
        incidentLinks: incidentLinksByNodeId.get(node.id) ?? [],
        simNodes,
        maxDistance: maxInteractiveLinkDistance,
      });
      simulation.alpha(0.5).restart();
      syncPositions();
    })
    .on("end", (event, node) => {
      event.sourceEvent?.stopPropagation();
      node.fx = clampX(node.x);
      node.fy = clampY(node.y);
      simulation.alphaTarget(0);
    });

  nodeSelection.call(drag).style("cursor", "grab");
};
