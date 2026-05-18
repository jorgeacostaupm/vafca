import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "public/data/testData.json");
const outputDir = resolve(root, "public/data/examples");

const schemaVersion = "fc-connectivity-v1.0";
const atlasId = "aal-90";

const statDefinitions = {
  mean: {
    category: "descriptive",
    scaleType: "sequential",
    center: null,
    rangeMode: "inherit_measure",
  },
  std: {
    category: "dispersion",
    scaleType: "sequential",
    center: null,
    rangeMode: "non_negative_observed",
  },
  zscore: {
    category: "standardized",
    scaleType: "diverging",
    center: 0,
    rangeMode: "observed_symmetric",
    expectedRange: null,
  },
};

const populationDefaults = {
  p1: 10,
  p2: 20,
};

const toLabel = (value) =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const toCatalogs = (catalogs) => ({
  bands: Object.fromEntries(
    Object.entries(catalogs.bands).map(([id, band]) => [
      id,
      {
        id,
        label: band.label ?? toLabel(id),
        rangeHz: [band.min, band.max],
        description: band.description ?? null,
      },
    ]),
  ),
  measures: Object.fromEntries(
    Object.entries(catalogs.measures).map(([id, measure]) => [
      id,
      {
        id,
        label: measure.label ?? id,
        description: measure.description ?? null,
        expectedRange: [measure.min ?? 0, measure.max ?? 1],
        valueDomain: {
          min: measure.min ?? 0,
          max: measure.max ?? 1,
          center: null,
          units: null,
        },
        symmetric: false,
        directed: false,
      },
    ]),
  ),
  stats: Object.fromEntries(
    Object.entries(catalogs.stats).map(([id, stat]) => [
      id,
      {
        id,
        label: stat.label ?? toLabel(id),
        description: stat.description ?? null,
        ...(statDefinitions[id] ?? {
          category: "descriptive",
          scaleType: "sequential",
          center: null,
          rangeMode: "observed",
        }),
      },
    ]),
  ),
  populations: Object.fromEntries(
    Object.entries(catalogs.populations).map(([id, population]) => [
      id,
      {
        id,
        label: population.label ?? toLabel(id),
        description: population.description ?? null,
        n: population.n ?? populationDefaults[id] ?? 1,
        metadata: {},
      },
    ]),
  ),
  subjects: {},
  roiGroupSchemes: {},
});

const toAtlas = (matrixOrder) => ({
  id: atlasId,
  name: "AAL 90 from testData",
  description: "Atlas derived from public/data/testData.json matrixOrder.",
  version: "1.0.0",
  space: "MNI",
  coordinateSystem: "MNI152",
  rois: matrixOrder.map((roi, index) => ({
    index,
    id: roi.id,
    atlasId: roi.atlasId,
    name: roi.label,
    label: roi.acronym ?? roi.label,
    tags: roi.tags ?? {},
    coords: null,
    metadata: {
      fullLabel: roi.label,
      acronym: roi.acronym ?? null,
    },
  })),
});

const valueDomainForMatrix = (matrix, catalogs) => {
  if (matrix.statId === "zscore") {
    return { min: -5, max: 5, center: 0, units: "z-score" };
  }

  const measure = catalogs.measures[matrix.measureId];
  if (matrix.statId === "std") {
    return { min: 0, max: measure?.valueDomain?.max ?? 1, center: null, units: null };
  }

  return measure?.valueDomain ?? { min: 0, max: 1, center: null, units: null };
};

const toUpperTriangularData = (matrixData) => {
  const values = [];
  for (let row = 0; row < matrixData.length; row += 1) {
    for (let col = row; col < matrixData.length; col += 1) {
      values.push(matrixData[row][col]);
    }
  }
  return values;
};

const findPopulationMatrixId = (matrices, matrix, populationId, statId) =>
  matrices.find(
    (candidate) =>
      candidate.bandId === matrix.bandId &&
      candidate.measureId === matrix.measureId &&
      candidate.statId === statId &&
      candidate.populationIds.length === 1 &&
      candidate.populationIds[0] === populationId,
  )?.id ?? null;

const toPopulationSource = (populationIds, catalogs) => ({
  level: "population",
  populationIds,
  n: populationIds.reduce(
    (sum, populationId) => sum + (catalogs.populations[populationId]?.n ?? 1),
    0,
  ),
});

const toComparisonSource = (populationIds, catalogs) => ({
  level: "comparison",
  left: {
    level: "population",
    populationIds: [populationIds[0]],
    label: catalogs.populations[populationIds[0]]?.label ?? populationIds[0],
    n: catalogs.populations[populationIds[0]]?.n ?? 1,
  },
  right: {
    level: "population",
    populationIds: [populationIds[1]],
    label: catalogs.populations[populationIds[1]]?.label ?? populationIds[1],
    n: catalogs.populations[populationIds[1]]?.n ?? 1,
  },
});

const toMatrixRecord = (matrix, sourceMatrices, catalogs) => {
  const isComparison = matrix.statId === "zscore" || matrix.populationIds.length > 1;
  const leftMatrixId = isComparison
    ? findPopulationMatrixId(sourceMatrices, matrix, matrix.populationIds[0], "mean")
    : null;
  const rightMatrixId = isComparison
    ? findPopulationMatrixId(sourceMatrices, matrix, matrix.populationIds[1], "mean")
    : null;

  return {
    id: matrix.id,
    kind: isComparison ? "comparison" : "aggregate",
    label: [
      catalogs.bands[matrix.bandId]?.label ?? matrix.bandId,
      catalogs.measures[matrix.measureId]?.label ?? matrix.measureId,
      catalogs.stats[matrix.statId]?.label ?? matrix.statId,
      matrix.populationIds.map((id) => catalogs.populations[id]?.label ?? id).join(" vs "),
    ].join(" - "),
    context: {
      bandId: matrix.bandId,
      measureId: matrix.measureId,
      conditionId: null,
      sessionId: null,
      taskId: null,
    },
    source: isComparison
      ? toComparisonSource(matrix.populationIds, catalogs)
      : toPopulationSource(matrix.populationIds, catalogs),
    stat: {
      id: matrix.statId,
      method:
        matrix.statId === "mean"
          ? "arithmetic"
          : matrix.statId === "zscore"
            ? "z-score"
            : matrix.statId,
      parameters: {},
    },
    geometry: {
      atlasId,
      shape: [matrix.size, matrix.size],
      roiOrderRef: "atlas.rois",
      roiOrder: null,
    },
    encoding: {
      layout: "upper_triangular",
      dtype: "float32",
      symmetric: true,
      missingValue: null,
    },
    valueDomain: valueDomainForMatrix(matrix, catalogs),
    provenance: {
      generatedBy: "convert-testdata-to-connectivity-bundle",
      createdAt: null,
      software: "codex-generated",
      version: null,
      dependencies: ["public/data/testData.json"],
      parameters: {
        sourceMatrixId: matrix.id,
        sourceStatMethod: matrix.statMethod ?? null,
      },
    },
    ...(isComparison
      ? {
          comparison: {
            operator: "zscore",
            comparisonType: "population_zscore",
            formula: "(left - right) / pooled_std",
            leftMatrixId,
            rightMatrixId,
            parameters: {
              populationOrder: matrix.populationIds,
            },
          },
        }
      : {}),
    data: toUpperTriangularData(matrix.data),
  };
};

const toBundle = (source, options) => {
  const matrices = source.matrices.filter((matrix) =>
    options.includeZscore ? true : matrix.statId !== "zscore",
  );
  const statIds = new Set(matrices.map((matrix) => matrix.statId));
  const catalogs = toCatalogs({
    ...source.catalogs,
    stats: Object.fromEntries(
      Object.entries(source.catalogs.stats).filter(([id]) => statIds.has(id)),
    ),
  });

  return {
    schemaVersion,
    bundle: {
      id: options.id,
      label: options.label,
      description: options.description,
      createdAt: null,
    },
    atlas: toAtlas(source.metadata.matrixOrder),
    catalogs,
    matrices: matrices.map((matrix) => toMatrixRecord(matrix, source.matrices, catalogs)),
  };
};

const source = JSON.parse(await readFile(sourcePath, "utf8"));
const outputs = [
  {
    fileName: "14_testdata_full_zscore.json",
    includeZscore: true,
    id: "bundle_testdata_full_zscore",
    label: "testData full dataset with z-score",
    description:
      "Current connectivity bundle generated from public/data/testData.json, including mean, std and z-score matrices.",
  },
  {
    fileName: "15_testdata_without_zscore.json",
    includeZscore: false,
    id: "bundle_testdata_without_zscore",
    label: "testData without z-score",
    description:
      "Current connectivity bundle generated from public/data/testData.json, including only mean and std matrices.",
  },
];

for (const output of outputs) {
  const bundle = toBundle(source, output);
  const outputPath = resolve(outputDir, output.fileName);
  await writeFile(outputPath, `${JSON.stringify(bundle, null, 2)}\n`);
  console.log(`Wrote ${bundle.matrices.length} matrices to ${outputPath}`);
}
