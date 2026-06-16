import type {
  NetworkGroupSummary,
  NetworkSummaryGrouping,
} from "@/types/networkMeasures";
import type { NetworkMeasureGraph } from "@/utils/networkMeasures/graphBuilder";

const getFirstAvailableTagField = (graph: NetworkMeasureGraph) => {
  for (const node of graph.nodes) {
    const [field] = Object.keys(node.tags);
    if (field) return field;
  }
  return null;
};

const resolveGroupingFields = (
  graph: NetworkMeasureGraph,
  activeGroupingFields: string[],
): NetworkSummaryGrouping => {
  if (activeGroupingFields.length > 0) {
    return {
      fields: activeGroupingFields,
      source: "activeGrouping",
    };
  }

  const firstTag = getFirstAvailableTagField(graph);
  if (firstTag) {
    return {
      fields: [firstTag],
      source: "firstTag",
    };
  }

  return {
    fields: [],
    source: "unavailable",
    unavailableReason: "No scalar node tag fields are available.",
  };
};

const getNodeGroup = (
  graph: NetworkMeasureGraph,
  nodeIndex: number,
  fields: string[],
) => {
  const node = graph.nodes[nodeIndex];
  const values = fields.map((field) => String(node.tags[field] ?? "Unknown"));
  return {
    id: values.join(" / "),
    label: values.join(" / "),
  };
};

export const buildGroupSummaries = ({
  graph,
  activeGroupingFields,
  includeDiagonal,
}: {
  graph: NetworkMeasureGraph;
  activeGroupingFields: string[];
  includeDiagonal: boolean;
}): { grouping: NetworkSummaryGrouping; groups: NetworkGroupSummary[] } => {
  const grouping = resolveGroupingFields(graph, activeGroupingFields);
  if (grouping.fields.length === 0) return { grouping, groups: [] };

  const nodeGroups = graph.nodes.map((_, index) =>
    getNodeGroup(graph, index, grouping.fields),
  );
  const summaries = new Map<string, NetworkGroupSummary>();

  const ensureGroup = (id: string, label: string) => {
    const existing = summaries.get(id);
    if (existing) return existing;
    const next: NetworkGroupSummary = {
      id,
      label,
      nodeCount: 0,
      internalPossibleEdgeCount: 0,
      internalEdgeCount: 0,
      internalDensity: null,
      externalPossibleEdgeCount: 0,
      externalEdgeCount: 0,
      externalDensity: null,
    };
    summaries.set(id, next);
    return next;
  };

  nodeGroups.forEach((group) => {
    const summary = ensureGroup(group.id, group.label);
    summary.nodeCount += 1;
  });

  const nodeCount = graph.nodes.length;
  summaries.forEach((summary) => {
    const internalWithoutDiagonal = graph.directed
      ? summary.nodeCount * Math.max(0, summary.nodeCount - 1)
      : (summary.nodeCount * Math.max(0, summary.nodeCount - 1)) / 2;
    summary.internalPossibleEdgeCount =
      internalWithoutDiagonal + (includeDiagonal ? summary.nodeCount : 0);
    summary.externalPossibleEdgeCount =
      summary.nodeCount * Math.max(0, nodeCount - summary.nodeCount);
  });

  graph.edges.forEach((edge) => {
    const sourceGroup = nodeGroups[edge.sourceIndex];
    const targetGroup = nodeGroups[edge.targetIndex];
    if (!sourceGroup || !targetGroup) return;

    if (sourceGroup.id === targetGroup.id) {
      ensureGroup(sourceGroup.id, sourceGroup.label).internalEdgeCount += 1;
      return;
    }

    ensureGroup(sourceGroup.id, sourceGroup.label).externalEdgeCount += 1;
    ensureGroup(targetGroup.id, targetGroup.label).externalEdgeCount += 1;
  });

  const groups = Array.from(summaries.values()).map((summary) => ({
    ...summary,
    internalDensity:
      summary.internalPossibleEdgeCount > 0
        ? summary.internalEdgeCount / summary.internalPossibleEdgeCount
        : null,
    externalDensity:
      summary.externalPossibleEdgeCount > 0
        ? summary.externalEdgeCount / summary.externalPossibleEdgeCount
        : null,
  }));

  return {
    grouping,
    groups: groups.sort((left, right) =>
      left.label.localeCompare(right.label, undefined, { sensitivity: "base" }),
    ),
  };
};
