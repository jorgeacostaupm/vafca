import type {
  NetworkGlobalMeasures,
  NetworkNodeSummary,
} from "@/types/networkMeasures";
import type { NetworkMeasureGraph } from "@/utils/networkMeasures/graphBuilder";
import { mean } from "@/utils/networkMeasures/statistics";

const getComponents = (adjacency: Array<Set<number>>) => {
  const visited = new Set<number>();
  const components: number[][] = [];

  adjacency.forEach((_, start) => {
    if (visited.has(start)) return;

    const component: number[] = [];
    const queue = [start];
    visited.add(start);

    for (let index = 0; index < queue.length; index += 1) {
      const node = queue[index];
      component.push(node);
      adjacency[node].forEach((neighbor) => {
        if (visited.has(neighbor)) return;
        visited.add(neighbor);
        queue.push(neighbor);
      });
    }

    components.push(component);
  });

  return components;
};

const getLocalClustering = (
  nodeIndex: number,
  adjacency: Array<Set<number>>,
) => {
  const neighbors = Array.from(adjacency[nodeIndex]);
  if (neighbors.length < 2) return 0;

  let linkedNeighborPairs = 0;
  for (let i = 0; i < neighbors.length; i += 1) {
    for (let j = i + 1; j < neighbors.length; j += 1) {
      if (adjacency[neighbors[i]].has(neighbors[j])) linkedNeighborPairs += 1;
    }
  }

  return linkedNeighborPairs / ((neighbors.length * (neighbors.length - 1)) / 2);
};

const getAllPairsPathMeasures = (adjacency: Array<Set<number>>) => {
  const nodeCount = adjacency.length;
  let reachablePairCount = 0;
  let distanceSum = 0;
  let efficiencySum = 0;
  let diameter = 0;

  for (let source = 0; source < nodeCount; source += 1) {
    const distances = Array.from({ length: nodeCount }, () => -1);
    const queue = [source];
    distances[source] = 0;

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      adjacency[current].forEach((neighbor) => {
        if (distances[neighbor] >= 0) return;
        distances[neighbor] = distances[current] + 1;
        queue.push(neighbor);
      });
    }

    for (let target = source + 1; target < nodeCount; target += 1) {
      const distance = distances[target];
      if (distance <= 0) continue;
      reachablePairCount += 1;
      distanceSum += distance;
      efficiencySum += 1 / distance;
      diameter = Math.max(diameter, distance);
    }
  }

  const possiblePairs = (nodeCount * (nodeCount - 1)) / 2;

  return {
    averagePathLength:
      reachablePairCount > 0 ? distanceSum / reachablePairCount : null,
    globalEfficiency: possiblePairs > 0 ? efficiencySum / possiblePairs : null,
    diameter: reachablePairCount > 0 ? diameter : null,
  };
};

export const buildNodeSummaries = (
  graph: NetworkMeasureGraph,
): NetworkNodeSummary[] =>
  graph.nodes.map((node, index) => {
    const degree = graph.adjacency[index].size;
    return {
      id: node.id,
      label: node.label,
      degree,
      isolated: degree === 0,
      clustering: getLocalClustering(index, graph.adjacency),
    };
  });

export const buildGlobalMeasures = (
  graph: NetworkMeasureGraph,
  nodes: NetworkNodeSummary[],
): NetworkGlobalMeasures => {
  const degrees = nodes.map((node) => node.degree);
  const components = getComponents(graph.adjacency);
  const giantComponentSize =
    components.length > 0
      ? Math.max(...components.map((component) => component.length))
      : 0;
  const nodeCount = graph.nodes.length;
  const triangles = graph.nodes.reduce((count, _, nodeIndex) => {
    const neighbors = Array.from(graph.adjacency[nodeIndex]);
    let localTriangles = 0;
    for (let i = 0; i < neighbors.length; i += 1) {
      for (let j = i + 1; j < neighbors.length; j += 1) {
        if (graph.adjacency[neighbors[i]].has(neighbors[j])) localTriangles += 1;
      }
    }
    return count + localTriangles;
  }, 0) / 3;
  const connectedTriples = degrees.reduce(
    (sum, degree) => sum + (degree * (degree - 1)) / 2,
    0,
  );
  const paths = getAllPairsPathMeasures(graph.adjacency);

  return {
    meanDegree: mean(degrees),
    maxDegree: degrees.length > 0 ? Math.max(...degrees) : 0,
    componentCount: components.length,
    giantComponentSize,
    giantComponentRatio: nodeCount > 0 ? giantComponentSize / nodeCount : null,
    isolatedNodeCount: nodes.filter((node) => node.isolated).length,
    meanClustering: mean(nodes.map((node) => node.clustering ?? 0)),
    transitivity:
      connectedTriples > 0 ? (3 * triangles) / connectedTriples : null,
    globalEfficiency: paths.globalEfficiency,
    averagePathLength: paths.averagePathLength,
    diameter: paths.diameter,
  };
};
