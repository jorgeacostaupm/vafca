import type { SelectedLink } from "@/types/visualizationUi";

export type SelectedLinksFallbackNodeMode = "all" | "connected";

type BuildSelectedLinksFallbackGraphArgs = {
  links: SelectedLink[];
  atlasOrder: string[];
  labelById: Record<string, string>;
  nodeMode: SelectedLinksFallbackNodeMode;
};

const unique = (values: string[]) => Array.from(new Set(values));

export const buildSelectedLinksFallbackGraph = ({
  links,
  atlasOrder,
  labelById,
  nodeMode,
}: BuildSelectedLinksFallbackGraphArgs) => {
  const linkedNodeIds = unique(
    links.flatMap((link) => [link.rowId, link.colId]),
  );
  const fallbackNodeIds = linkedNodeIds.sort((a, b) =>
    (labelById[a] ?? a).localeCompare(labelById[b] ?? b),
  );
  const availableNodeIds = atlasOrder.length > 0 ? atlasOrder : fallbackNodeIds;
  const nodeIds = nodeMode === "all" ? availableNodeIds : fallbackNodeIds;
  const indexById = new Map(nodeIds.map((id, index) => [id, index] as const));
  const data = nodeIds.map(() => nodeIds.map(() => 0));

  const edgeIds = new Set<string>();
  links.forEach((link) => {
    const rowIndex = indexById.get(link.rowId);
    const colIndex = indexById.get(link.colId);
    if (rowIndex === undefined || colIndex === undefined) return;

    const key = [link.rowId, link.colId].sort().join("::");
    if (edgeIds.has(key)) return;
    edgeIds.add(key);
    data[rowIndex][colIndex] = 1;
    data[colIndex][rowIndex] = 1;
  });

  return {
    data,
    labels: nodeIds,
    edgeCount: edgeIds.size,
  };
};

export const assertSelectedLinksFallbackGraph = () => {
  const graph = buildSelectedLinksFallbackGraph({
    links: [{
      id: "a::b",
      rowId: "b",
      colId: "a",
      rowLabel: "B",
      colLabel: "A",
      sources: [],
    }],
    atlasOrder: ["a", "b", "c"],
    labelById: { a: "A", b: "B", c: "C" },
    nodeMode: "all",
  });

  console.assert(graph.labels.length === 3, "all mode keeps available atlas nodes");
  console.assert(graph.edgeCount === 1, "selected links become boolean edges");
  console.assert(graph.data[0][1] === 1 && graph.data[1][0] === 1, "adjacency is symmetric");
};
