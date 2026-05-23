import * as d3 from "d3";
import {
  NODE_LINK_LAYOUT_BOUNDARY_DAMPING,
  NODE_LINK_LAYOUT_BOUNDARY_STRENGTH,
  NODE_LINK_LAYOUT_ELLIPSE_INSET,
  NODE_LINK_LAYOUT_MARGIN,
  NODE_LINK_LAYOUT_MAX_ITERATIONS,
  NODE_LINK_LAYOUT_MAX_LINK_DISTANCE,
  NODE_LINK_LAYOUT_MIN_ITERATIONS,
  NODE_LINK_LAYOUT_MIN_LINK_DISTANCE,
} from "@/config/ui";
import type { ClassicLink, ClassicNode } from "@/types/nodelink";

type ComputeForceLayoutArgs = {
  nodes: ClassicNode[];
  links: ClassicLink[];
  width: number;
  height: number;
  nodeRadius: number;
};

type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type LayoutEllipse = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

const getGraphDensity = (nodeCount: number, linkCount: number) => {
  if (nodeCount < 2) return 0;
  return linkCount / ((nodeCount * (nodeCount - 1)) / 2);
};

const getLayoutIterations = (nodeCount: number, linkCount: number) => {
  const scaledIterations = nodeCount * 6 + Math.sqrt(linkCount) * 18;
  return Math.round(
    Math.min(
      NODE_LINK_LAYOUT_MAX_ITERATIONS,
      Math.max(NODE_LINK_LAYOUT_MIN_ITERATIONS, scaledIterations),
    ),
  );
};

const getLinkDistance = (args: {
  width: number;
  height: number;
  nodeCount: number;
  density: number;
}) => {
  const { width, height, nodeCount, density } = args;
  const minDim = Math.min(width, height);
  const sparseDistance = minDim / Math.max(3, Math.sqrt(nodeCount));
  const denseCompression = 1 - Math.min(0.4, density * 0.35);
  const distance = sparseDistance * denseCompression;

  return Math.max(
    NODE_LINK_LAYOUT_MIN_LINK_DISTANCE,
    Math.min(NODE_LINK_LAYOUT_MAX_LINK_DISTANCE, distance),
  );
};

const getNodeBounds = (nodes: ClassicNode[]): Bounds | null => {
  const xs = nodes.map((node) => node.x).filter(Number.isFinite) as number[];
  const ys = nodes.map((node) => node.y).filter(Number.isFinite) as number[];
  if (xs.length === 0 || ys.length === 0) return null;

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const getLayoutEllipse = (args: {
  width: number;
  height: number;
  padding: number;
}): LayoutEllipse => {
  const { width, height, padding } = args;
  return {
    cx: width / 2,
    cy: height / 2,
    rx: Math.max(1, width / 2 - padding),
    ry: Math.max(1, height / 2 - padding),
  };
};

const fitNodesToEllipse = (args: {
  nodes: ClassicNode[];
  width: number;
  height: number;
  ellipse: LayoutEllipse;
}) => {
  const { nodes, width, height, ellipse } = args;
  const bounds = getNodeBounds(nodes);
  if (!bounds) return;

  const sourceWidth = Math.max(1, bounds.maxX - bounds.minX);
  const sourceHeight = Math.max(1, bounds.maxY - bounds.minY);
  const targetWidth = Math.max(1, ellipse.rx * 2 * NODE_LINK_LAYOUT_ELLIPSE_INSET);
  const targetHeight = Math.max(1, ellipse.ry * 2 * NODE_LINK_LAYOUT_ELLIPSE_INSET);
  const scale = Math.min(1, targetWidth / sourceWidth, targetHeight / sourceHeight);
  const sourceCenterX = (bounds.minX + bounds.maxX) / 2;
  const sourceCenterY = (bounds.minY + bounds.maxY) / 2;
  const targetCenterX = width / 2;
  const targetCenterY = height / 2;

  nodes.forEach((node) => {
    node.x = targetCenterX + ((node.x ?? sourceCenterX) - sourceCenterX) * scale;
    node.y = targetCenterY + ((node.y ?? sourceCenterY) - sourceCenterY) * scale;
    constrainNodeToEllipse({ node, ellipse });
  });
};

const getNormalizedEllipseDistance = (args: {
  node: ClassicNode;
  ellipse: LayoutEllipse;
}) => {
  const { node, ellipse } = args;
  const dx = ((node.x ?? ellipse.cx) - ellipse.cx) / ellipse.rx;
  const dy = ((node.y ?? ellipse.cy) - ellipse.cy) / ellipse.ry;
  return { dx, dy, distance: Math.hypot(dx, dy) };
};

const constrainNodeToEllipse = (args: {
  node: ClassicNode;
  ellipse: LayoutEllipse;
}) => {
  const { node, ellipse } = args;
  const { dx, dy, distance } = getNormalizedEllipseDistance({ node, ellipse });
  if (distance <= NODE_LINK_LAYOUT_ELLIPSE_INSET) return;

  const scale = NODE_LINK_LAYOUT_ELLIPSE_INSET / Math.max(distance, 0.001);
  node.x = ellipse.cx + dx * scale * ellipse.rx;
  node.y = ellipse.cy + dy * scale * ellipse.ry;
  node.vx = (node.vx ?? 0) * NODE_LINK_LAYOUT_BOUNDARY_DAMPING;
  node.vy = (node.vy ?? 0) * NODE_LINK_LAYOUT_BOUNDARY_DAMPING;
};

const applyEllipseBoundaryForce = (args: {
  node: ClassicNode;
  ellipse: LayoutEllipse;
}) => {
  const { node, ellipse } = args;
  const { dx, dy, distance } = getNormalizedEllipseDistance({ node, ellipse });
  const forceStart = 0.78;
  if (distance <= forceStart) return;

  const targetDistance = forceStart;
  const scale = targetDistance / Math.max(distance, 0.001);
  const targetX = ellipse.cx + dx * scale * ellipse.rx;
  const targetY = ellipse.cy + dy * scale * ellipse.ry;
  const strength = NODE_LINK_LAYOUT_BOUNDARY_STRENGTH * (distance - forceStart);

  node.vx = (node.vx ?? 0) + (targetX - (node.x ?? ellipse.cx)) * strength;
  node.vy = (node.vy ?? 0) + (targetY - (node.y ?? ellipse.cy)) * strength;
};

const spreadConstrainedNodes = (args: {
  nodes: ClassicNode[];
  ellipse: LayoutEllipse;
}) => {
  const { nodes, ellipse } = args;
  if (nodes.length < 2) return;

  const angleByNode = new Map<number, ClassicNode[]>();
  nodes.forEach((node) => {
    const x = node.x ?? ellipse.cx;
    const y = node.y ?? ellipse.cy;
    const distance = Math.hypot((x - ellipse.cx) / ellipse.rx, (y - ellipse.cy) / ellipse.ry);
    if (distance < NODE_LINK_LAYOUT_ELLIPSE_INSET - 0.01) return;

    const angleBucket = Math.round(Math.atan2(y - ellipse.cy, x - ellipse.cx) * 24);
    const bucket = angleByNode.get(angleBucket) ?? [];
    bucket.push(node);
    angleByNode.set(angleBucket, bucket);
  });

  angleByNode.forEach((bucket) => {
    if (bucket.length < 2) return;
    const offsetStep = Math.min(0.018, 0.08 / bucket.length);
    bucket.forEach((node, index) => {
      const angle = Math.atan2((node.y ?? ellipse.cy) - ellipse.cy, (node.x ?? ellipse.cx) - ellipse.cx);
      const offset = (index - (bucket.length - 1) / 2) * offsetStep;
      node.x = ellipse.cx + Math.cos(angle + offset) * ellipse.rx * NODE_LINK_LAYOUT_ELLIPSE_INSET;
      node.y = ellipse.cy + Math.sin(angle + offset) * ellipse.ry * NODE_LINK_LAYOUT_ELLIPSE_INSET;
    });
  });
};

export const computeForceLayout = ({
  nodes,
  links,
  width,
  height,
  nodeRadius,
}: ComputeForceLayoutArgs) => {
  if (nodes.length === 0) return;

  const density = getGraphDensity(nodes.length, links.length);
  const linkDistance = getLinkDistance({
    width,
    height,
    nodeCount: nodes.length,
    density,
  });
  const denseChargeCompression = 1 - Math.min(0.55, density * 0.5);
  const chargeStrength = -Math.max(
    70,
    Math.min(320, linkDistance * 3.2 * denseChargeCompression),
  );
  const collisionRadius = nodeRadius + Math.max(8, Math.min(16, linkDistance / 6));
  const padding = Math.max(NODE_LINK_LAYOUT_MARGIN, collisionRadius + 4);
  const ellipse = getLayoutEllipse({ width, height, padding });
  const iterations = getLayoutIterations(nodes.length, links.length);

  const simulation = d3
    .forceSimulation<ClassicNode>(nodes)
    .force(
      "link",
      d3
        .forceLink<ClassicNode, ClassicLink>(links)
        .id((node) => node.id)
        .distance(linkDistance)
        .strength(Math.max(0.15, 0.7 - density * 0.45)),
    )
    .force("charge", d3.forceManyBody().strength(chargeStrength))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(0.03))
    .force("y", d3.forceY(height / 2).strength(0.03))
    .force("collision", d3.forceCollide(collisionRadius).iterations(2))
    .stop();

  for (let i = 0; i < iterations; i += 1) {
    simulation.tick();
    nodes.forEach((node) => {
      applyEllipseBoundaryForce({ node, ellipse });
      constrainNodeToEllipse({ node, ellipse });
    });
  }
  simulation.stop();

  fitNodesToEllipse({ nodes, width, height, ellipse });
  spreadConstrainedNodes({ nodes, ellipse });
};
