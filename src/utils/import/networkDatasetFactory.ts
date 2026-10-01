import type {
  Catalogs,
  MatrixNetworkData,
  Network,
  NetworkDataset,
  NodeSet,
} from "@/types/network";
import type { NodeOrderEntry } from "@/types/nodeOrder";
import type {
  ImportedNetworkDraft,
  NetworkDatasetDraft,
} from "@/utils/import/types";
import { computeNetworkMatrixDataStats } from "@/utils/networkDataStats";

const DEFAULT_NODE_TERMINOLOGY = {
  singular: "Node",
  plural: "Nodes",
} as const;

const createNodeSet = (dataset: NetworkDatasetDraft): NodeSet => ({
  id: dataset.atlas.id,
  label: dataset.atlas.name,
  terminology: DEFAULT_NODE_TERMINOLOGY,
  nodes: [...dataset.atlas.nodes]
    .sort((left, right) => left.index - right.index)
    .map((node) => ({
      id: node.id,
      label: node.label,
      name: node.name,
      atlasId: node.atlasId,
      index: node.index,

      metadata: node.metadata,
      coords: node.coords ?? null,
    })),
});

const createCatalogs = (dataset: NetworkDatasetDraft): Catalogs => ({
  core: dataset.catalogs.core,
  aspects: dataset.catalogs.aspects,
  sources: dataset.catalogs.sources,
  measures: Object.fromEntries(
    Object.values(dataset.catalogs.measures).map((measure) => {
      return [
        measure.id,
        {
          ...measure,
          description: measure.description ?? null,
          expectedRange: measure.expectedRange ?? null,
          enabled: measure.enabled,
        },
      ];
    }),
  ),
  statistics: Object.fromEntries(
    Object.values(dataset.catalogs.statistics).map((statistic) => [
      statistic.id,
      {
        ...statistic,
        description: statistic.description ?? null,
        category: statistic.category ?? "imported",
        scaleType: statistic.scaleType ?? "sequential",
        center: statistic.center ?? null,
        rangeMode: statistic.rangeMode ?? "observed",
      },
    ]),
  ),
  aspectCatalogs: dataset.catalogs.aspectCatalogs,
});

const createNetwork = ({
  draft,
  nodeSet,
  importedAt,
}: {
  draft: ImportedNetworkDraft;
  nodeSet: NodeSet;
  importedAt: string;
}): Network => {
  const data: MatrixNetworkData = {
    format: "matrix",
    layout: "full",
    dtype: "float64",
    values: draft.data,
    missingValue: null,
  };

  return {
    id: draft.id,
    label: draft.label,
    sourceId: draft.sourceId,
    measureId: draft.measureId,
    statisticId: draft.statisticId,
    dimensions: draft.dimensions,
    nodeSetId: nodeSet.id,
    nodeIds: nodeSet.nodes.map((node) => node.id),
    data,
    valueDomain: draft.valueDomain,
    dataStats: computeNetworkMatrixDataStats(draft.data),
    provenance: {
      generatedBy: "vafca-zip-importer",
      createdAt: importedAt,
      dependencies: [],
      parameters: {
        source: draft.source,
        originalLayout: draft.layout,
      },
    },
  };
};

export const createNetworkDatasetFromDraft = (
  dataset: NetworkDatasetDraft,
): NetworkDataset => {
  const nodeSet = createNodeSet(dataset);
  const networks = dataset.networks.map((draft) =>
    createNetwork({
      draft,
      nodeSet,
      importedAt: dataset.source.importedAt,
    }),
  );

  return {
    id: dataset.atlas.id,
    label: dataset.atlas.name,
    createdAt: dataset.source.importedAt,
    nodeSet,
    catalogs: createCatalogs(dataset),
    networks,
    networkIndex: Object.fromEntries(
      networks.map((network) => [network.id, network]),
    ),
  };
};

export const createNodeOrderFromDraft = (
  dataset: NetworkDatasetDraft,
): NodeOrderEntry[] =>
  dataset.atlas.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    name: node.name,
    acronym: node.label,

    metadata: node.metadata,
  }));
