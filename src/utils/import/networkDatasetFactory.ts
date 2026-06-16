import type {
  Catalogs,
  MatrixNetworkData,
  Network,
  NetworkDataset,
  NetworkSource,
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

const firstPopulationId = (
  ids: string[],
  fallback = "unknown-population",
) => ids[0] ?? fallback;

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
      index: node.index,
      tags: node.tags,
      metadata: node.metadata,
      coords: null,
    })),
});

const getMeasureSymmetry = (
  dataset: NetworkDatasetDraft,
  measureId: string,
) => {
  const networks = dataset.networks.filter(
    (network) => network.measureId === measureId,
  );
  return networks.length === 0 || networks.every((network) => network.symmetric);
};

const createCatalogs = (dataset: NetworkDatasetDraft): Catalogs => ({
  layers: Object.fromEntries(
    Object.values(dataset.catalogs.layers).map((layer) => [
      layer.id,
      {
        id: layer.id,
        label: layer.label ?? layer.id,
        description: layer.description ?? null,
        enabled: layer.enabled,
      },
    ]),
  ),
  measures: Object.fromEntries(
    Object.values(dataset.catalogs.measures).map((measure) => {
      const symmetric = getMeasureSymmetry(dataset, measure.id);
      return [
        measure.id,
        {
          id: measure.id,
          label: measure.label,
          description: measure.description ?? null,
          expectedRange: measure.expectedRange ?? null,
          min: measure.min,
          max: measure.max,
          symmetric,
          directed: !symmetric,
          enabled: measure.enabled,
        },
      ];
    }),
  ),
  statistics: Object.fromEntries(
    Object.values(dataset.catalogs.statistics).map((statistic) => [
      statistic.id,
      {
        id: statistic.id,
        label: statistic.label,
        category: statistic.category ?? "imported",
        scaleType: statistic.scaleType ?? "sequential",
        center: statistic.center ?? null,
        rangeMode: statistic.rangeMode ?? "observed",
        expectedRange: statistic.expectedRange,
        min: statistic.min,
        max: statistic.max,
        enabled: statistic.enabled,
        useDataRange: statistic.useDataRange,
      },
    ]),
  ),
  populations: Object.fromEntries(
    Object.values(dataset.catalogs.populations).map((population) => [
      population.id,
      {
        id: population.id,
        label: population.label,
        description: population.description ?? null,
        enabled: population.enabled,
        metadata: {},
      },
    ]),
  ),
  subjects: Object.fromEntries(
    dataset.networks
      .filter((network) => network.kind === "subject" && network.subjectId)
      .map((network) => [
        network.subjectId as string,
        {
          id: network.subjectId as string,
          label: network.subjectId as string,
          metadata: {},
        },
      ]),
  ),
});

const createSource = (network: ImportedNetworkDraft): NetworkSource => {
  if (network.kind === "subject") {
    return {
      type: "subject",
      subjectId: network.subjectId ?? network.id,
    };
  }

  if (network.kind === "comparison") {
    return {
      type: "comparison",
      left: {
        type: "population",
        populationId: network.populationIds[0] ?? network.comparison?.left ?? "left",
        label: network.comparison?.left,
      },
      right: {
        type: "population",
        populationId:
          network.populationIds[1] ?? network.comparison?.right ?? "right",
        label: network.comparison?.right,
      },
    };
  }

  return {
    type: "population",
    populationId: firstPopulationId(network.populationIds),
    n: network.n ?? 1,
  };
};

const createNetwork = ({
  draft,
  nodeSet,
  importedAt,
  importMode,
}: {
  draft: ImportedNetworkDraft;
  nodeSet: NodeSet;
  importedAt: string;
  importMode: string;
}): Network => {
  const data: MatrixNetworkData = {
    format: "matrix",
    layout: "full",
    dtype: "float64",
    values: draft.data,
    symmetric: draft.symmetric,
    missingValue: null,
  };

  return {
    id: draft.id,
    label: draft.label,
    source: createSource(draft),
    context: {
      layerId: draft.layerId,
      conditionId: null,
      sessionId: null,
      taskId: null,
    },
    measureId: draft.measureId,
    statisticId: draft.statisticId,
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
        importMode,
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
      importMode: dataset.source.importMode,
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
    tags: node.tags,
    metadata: node.metadata,
  }));
