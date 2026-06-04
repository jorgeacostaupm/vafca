import type {
  Atlas,
  Catalogs,
  ConnectivityMatrix,
} from "@/types/connectivityBundle";
import { CONNECTIVITY_SCHEMA_VERSION } from "@/types/connectivityBundle";
import type { DatasetMeta } from "@/types/datasetState";
import type { MatrixOrderEntry } from "@/types/matrixOrder";
import { computeRoiOrderHash } from "@/utils/connectivityMatrix";
import type { NormalizedConnectivityDataset } from "@/utils/import/types";
import { computeMatrixDataStats } from "@/utils/matrixDataStats";

const toAtlas = (dataset: NormalizedConnectivityDataset): Atlas => ({
  id: dataset.atlas.id,
  name: dataset.atlas.name,
  version: "1.0.0",
  rois: dataset.atlas.rois.map((roi) => ({
    index: roi.index,
    id: roi.id,
    atlasId: roi.index,
    name: roi.name ?? roi.label,
    label: roi.label,
    tags: roi.tags,
    coords: null,
    metadata: roi.metadata,
  })),
});

const getMeasureSymmetry = (
  dataset: NormalizedConnectivityDataset,
  measureId: string,
) => {
  const matrices = dataset.matrices.filter((matrix) => matrix.measureId === measureId);
  return matrices.length === 0 || matrices.every((matrix) => matrix.symmetric);
};

const toCatalogs = (dataset: NormalizedConnectivityDataset): Catalogs => ({
  layers: Object.fromEntries(
    Object.values(dataset.catalogs.layers).map((layer) => [
      layer.id,
      {
        id: layer.id,
        label: layer.label ?? layer.id,
        description: layer.description ?? null,
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
          symmetric,
          directed: !symmetric,
        },
      ];
    }),
  ),
  stats: Object.fromEntries(
    Object.values(dataset.catalogs.stats).map((stat) => [
      stat.id,
      {
        id: stat.id,
        label: stat.label,
        category: stat.category ?? "imported",
        scaleType: stat.scaleType ?? "sequential",
        center: stat.center ?? null,
        rangeMode: stat.rangeMode ?? "observed",
        expectedRange: stat.expectedRange,
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
        metadata: {},
      },
    ]),
  ),
  subjects: Object.fromEntries(
    dataset.matrices
      .filter((matrix) => matrix.kind === "subject" && matrix.subjectId)
      .map((matrix) => [
        matrix.subjectId as string,
        {
          id: matrix.subjectId as string,
          label: matrix.subjectId as string,
          populationIds: matrix.populationIds,
          metadata: {},
        },
      ]),
  ),
  roiGroupSchemes: {},
});

const toConnectivityMatrix = (
  dataset: NormalizedConnectivityDataset,
  atlas: Atlas,
  matrixIndex: number,
): ConnectivityMatrix => {
  const matrix = dataset.matrices[matrixIndex];
  const record: ConnectivityMatrix = {
    id: matrix.id,
    kind: matrix.kind,
    label: matrix.label,
    context: {
      layerId: matrix.layerId,
      measureId: matrix.measureId,
      conditionId: null,
      sessionId: null,
      taskId: null,
    },
    source: matrix.kind === "comparison"
      ? {
          level: "comparison",
          left: {
            level: "population",
            populationIds: [matrix.populationIds[0] ?? matrix.comparison?.left ?? "left"],
            label: matrix.comparison?.left,
          },
          right: {
            level: "population",
            populationIds: [matrix.populationIds[1] ?? matrix.comparison?.right ?? "right"],
            label: matrix.comparison?.right,
          },
        }
      : matrix.kind === "subject"
        ? {
            level: "subject",
            subjectId: matrix.subjectId ?? matrix.id,
            populationIds: matrix.populationIds,
          }
        : {
            level: "population",
            populationIds: matrix.populationIds,
            n: matrix.n ?? 1,
          },
    stat: {
      id: matrix.statId,
      method: null,
      parameters: {},
    },
    geometry: {
      atlasId: atlas.id,
      shape: [matrix.data.length, matrix.data.length],
      roiOrderRef: "atlas.rois",
      roiOrder: null,
    },
    encoding: {
      layout: "full",
      dtype: "float64",
      symmetric: matrix.symmetric,
      missingValue: null,
    },
    valueDomain: matrix.valueDomain,
    provenance: {
      generatedBy: "vafca-zip-importer",
      createdAt: dataset.source.importedAt,
      dependencies: [],
      parameters: {
        source: matrix.source,
        importMode: dataset.source.importMode,
        originalLayout: matrix.layout,
      },
    },
    comparison: matrix.kind === "comparison"
      ? {
          operator: matrix.statId,
          comparisonType: matrix.comparison?.comparisonType ?? "comparison",
          formula: matrix.statId,
          leftMatrixId: null,
          rightMatrixId: null,
          parameters: {
            left: matrix.comparison?.left,
            right: matrix.comparison?.right,
          },
        }
      : undefined,
    data: matrix.data,
  };

  return {
    ...record,
    dataStats: computeMatrixDataStats(record),
  };
};

export const createConnectivityStateFromNormalized = (
  dataset: NormalizedConnectivityDataset,
): DatasetMeta["content"] => {
  const atlas = toAtlas(dataset);
  const catalogs = toCatalogs(dataset);
  const matrices = dataset.matrices.map((_, index) =>
    toConnectivityMatrix(dataset, atlas, index),
  );

  return {
    schemaVersion: CONNECTIVITY_SCHEMA_VERSION,
    loadedBundle: {
      id: dataset.atlas.id,
      label: dataset.atlas.name,
      createdAt: dataset.source.importedAt,
    },
    atlas,
    roiOrderHash: computeRoiOrderHash(atlas),
    catalogs,
    matrices,
    matrixIndex: Object.fromEntries(matrices.map((matrix) => [matrix.id, matrix])),
  };
};

export const createMatrixOrderFromNormalized = (
  dataset: NormalizedConnectivityDataset,
): MatrixOrderEntry[] =>
  dataset.atlas.rois.map((roi) => ({
    id: roi.id,
    label: roi.label,
    name: roi.name,
    acronym: roi.label,
    tags: roi.tags,
    metadata: roi.metadata,
  }));

export const createDatasetMetaFromNormalized = (
  dataset: NormalizedConnectivityDataset,
): DatasetMeta => ({
  content: createConnectivityStateFromNormalized(dataset),
});
