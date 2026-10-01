import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { zipSync, strToU8 } from "fflate";

const outputDir = new URL("../public/data/examples/", import.meta.url);

const toZipEntries = (entries) =>
  Object.fromEntries(
    Object.entries(entries).map(([path, value]) => [
      path,
      strToU8(typeof value === "string" ? value : JSON.stringify(value, null, 2)),
    ]),
  );

const writeZip = (fileName, entries) => {
  writeFileSync(new URL(fileName, outputDir), zipSync(toZipEntries(entries)));
};

const toUpperTriangular = (matrix) => {
  const values = [];
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = row; column < matrix.length; column += 1) {
      values.push(matrix[row][column]);
    }
  }
  return values;
};

const topLeftSquare = (matrix, size) =>
  matrix.slice(0, size).map((row) => row.slice(0, size));

const aspectsCatalog = {
  core: {
    source: { label: "Source" },
    measure: { label: "Measure" },
    statistic: { label: "Statistic" },
  },
  aspects: [{ id: "band", label: "Band" }],
};

const defaultStatisticCatalog = {
  value: { label: "Value", scaleType: "sequential", rangeMode: "inherit_measure" },
  mean: { label: "Mean", scaleType: "sequential", rangeMode: "inherit_measure" },
  std: { label: "Standard deviation", scaleType: "sequential", rangeMode: "non_negative_observed" },
  zscore: { label: "z-score", scaleType: "diverging", center: 0, rangeMode: "observed_symmetric" },
};

mkdirSync(outputDir, { recursive: true });

writeZip("01_minimal_matrices.zip", {
  "catalogs/dimensions.json": aspectsCatalog,
  "catalogs/sources.json": { dataset: { label: "Dataset", kind: "population" } },
  "catalogs/measures.json": { connectivity: { label: "Connectivity", expectedRange: [0, 1] } },
  "catalogs/statistics.json": { value: defaultStatisticCatalog.value },
  "catalogs/band.json": { default: { label: "Default" } },
  "matrices.json": [
    {
      id: "dataset-default-connectivity-value",
      source: "dataset",
      measure: "connectivity",
      statistic: "value",
      dimensions: { band: "default" },
      layout: "full",
      data: [
        [0, 0.32, 0.18],
        [0.32, 0, 0.44],
        [0.18, 0.44, 0],
      ],
    },
  ],
});

writeZip("02_rois_and_matrices.zip", {
  "manifest.json": {
    formatVersion: "vafca-zip-v1",
    name: "ROI metadata demo",
  },
  "rois.json": [
    {
      index: 0,
      id: "frontal-l",
      label: "Frontal L",
      metadata: {
        hemisphere: "left",
        lobe: "frontal",
      },
    },
    {
      index: 1,
      id: "frontal-r",
      label: "Frontal R",
      metadata: {
        hemisphere: "right",
        lobe: "frontal",
      },
    },
    {
      index: 2,
      id: "temporal-l",
      label: "Temporal L",
      metadata: {
        hemisphere: "left",
        lobe: "temporal",
      },
    },
    {
      index: 3,
      id: "temporal-r",
      label: "Temporal R",
      metadata: {
        hemisphere: "right",
        lobe: "temporal",
      },
    },
  ],
  "catalogs/dimensions.json": aspectsCatalog,
  "catalogs/band.json": { alpha: { label: "Alpha" } },
  "catalogs/sources.json": { control: { label: "Control", kind: "population" } },
  "catalogs/measures.json": { plv: { label: "PLV", expectedRange: [0, 1] } },
  "catalogs/statistics.json": {
    mean: defaultStatisticCatalog.mean,
    std: defaultStatisticCatalog.std,
  },
  "matrices.json": [
    {
      id: "alpha-control-mean",
      label: "Alpha control mean",
      source: "control",
      measure: "plv",
      statistic: "mean",
      dimensions: { band: "alpha" },
      layout: "full",
      data: [
        [0, 0.28, 0.41, 0.19],
        [0.28, 0, 0.35, 0.52],
        [0.41, 0.35, 0, 0.31],
        [0.19, 0.52, 0.31, 0],
      ],
    },
    {
      id: "alpha-control-std",
      label: "Alpha control standard deviation",
      source: "control",
      measure: "plv",
      statistic: "std",
      dimensions: { band: "alpha" },
      layout: "full",
      data: [
        [0, 0.05, 0.08, 0.04],
        [0.05, 0, 0.07, 0.09],
        [0.08, 0.07, 0, 0.06],
        [0.04, 0.09, 0.06, 0],
      ],
    },
  ],
});

writeZip("03_matrix_folder.zip", {
  "manifest.json": {
    formatVersion: "vafca-zip-v1",
    name: "Matrix folder demo",
  },
  "rois.json": [
    { index: 0, id: "roi-a", label: "ROI A", metadata: { system: "A" } },
    { index: 1, id: "roi-b", label: "ROI B", metadata: { system: "A" } },
    { index: 2, id: "roi-c", label: "ROI C", metadata: { system: "B" } },
  ],
  "catalogs/dimensions.json": aspectsCatalog,
  "catalogs/band.json": {
    beta: { label: "Beta" },
    gamma: { label: "Gamma" },
  },
  "catalogs/sources.json": { dataset: { label: "Dataset", kind: "population" } },
  "catalogs/measures.json": {
    coherence: { label: "Coherence", expectedRange: [0, 1] },
  },
  "catalogs/statistics.json": { mean: defaultStatisticCatalog.mean },
  "matrices/beta.json": {
    id: "beta-dataset",
    label: "Beta dataset",
    source: "dataset",
    measure: "coherence",
    statistic: "mean",
    dimensions: { band: "beta" },
    layout: "full",
    data: [
      [0, 0.62, 0.21],
      [0.62, 0, 0.37],
      [0.21, 0.37, 0],
    ],
  },
  "matrices/gamma.json": {
    id: "gamma-dataset",
    label: "Gamma dataset",
    source: "dataset",
    measure: "coherence",
    statistic: "mean",
    dimensions: { band: "gamma" },
    layout: "full",
    data: [
      [0, 0.49, 0.33],
      [0.49, 0, 0.29],
      [0.33, 0.29, 0],
    ],
  },
});

const legacyTwoPopulationPath = new URL(
  "../public/data/test_Data_2_populations_z_score.json",
  import.meta.url,
);

if (existsSync(legacyTwoPopulationPath)) {
  const legacy = JSON.parse(readFileSync(legacyTwoPopulationPath, "utf8"));
  const atlasPath = new URL("../public/data/atlas_3d.json", import.meta.url);
  const atlas = existsSync(atlasPath)
    ? JSON.parse(readFileSync(atlasPath, "utf8"))
    : null;
  const geometries = atlas?.geometryFile
    ? JSON.parse(readFileSync(new URL(atlas.geometryFile, atlasPath), "utf8")) : {};
  const atlasRoisByLabel = new Map(
    Array.isArray(atlas?.rois)
      ? atlas.rois.map((roi) => [roi.label, roi])
      : [],
  );
  const rois = legacy.matrix_order.map((label, index) => {
    const atlasRoi = atlasRoisByLabel.get(label);
    return {
      index,
      id:
        atlasRoi?.id ??
        String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      atlasId: atlasRoi?.atlasId,
      label,
      name: atlasRoi?.name ?? label,
      coords: atlasRoi?.coords ?? null,
      metadata: atlasRoi?.metadata ?? {},

    };
  });
  const bands = Object.fromEntries(
    legacy.layers.map((layer) => [
      layer.acronim,
      {
        label: layer.name,
        description: layer.description,
      },
    ]),
  );
  const measures = Object.fromEntries(
    legacy.measures.map((measure) => [
      measure.acronim,
      {
        label: measure.name,
        description: measure.description,
        expectedRange: measure.range,
      },
    ]),
  );
  const sources = Object.fromEntries(
    legacy.types.map((type) => [
      type.acronim,
      {
        label: type.name,
        description: type.description,
        kind: type.acronim === "zscore" ? "comparison" : "population",
      },
    ]),
  );
  sources["study-vs-control"] = {
    label: "Study vs Control",
    kind: "comparison",
    left: "study",
    right: "control",
  };

  const isSquareMatrix = (value) =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((row) => Array.isArray(row) && row.length === value.length);

  const excludedSummaryBands = new Set(["max", "min", "mean"]);
  const matrices = legacy.matrices
    .filter((matrix) => !excludedSummaryBands.has(matrix.layer_acronim))
    .flatMap((matrix) => {
    const isComparison = matrix.type_acronim === "zscore";
    const stats = isComparison ? ["mean"] : ["mean", "std"];

    return stats
      .filter((stat) => isSquareMatrix(matrix[stat]))
      .map((stat) => ({
        id: [
          isComparison ? "study-vs-control" : matrix.type_acronim,
          matrix.layer_acronim,
          matrix.measure_acronim,
          isComparison ? "zscore" : stat,
        ].join("-"),
        label: [
          isComparison ? "study vs control" : matrix.type_acronim,
          matrix.layer_acronim,
          matrix.measure_acronim,
          isComparison ? "z-score" : stat,
        ].join(" "),
        layout: "upper_triangular",
        source: isComparison ? "study-vs-control" : matrix.type_acronim,
        measure: matrix.measure_acronim,
        statistic: isComparison ? "zscore" : stat,
        dimensions: { band: matrix.layer_acronim },
        data: toUpperTriangular(matrix[stat]),
      }));
    });

  writeZip("04_test_data_2_populations_z_score.zip", {
    "rois.json": rois,
    "rois-geometries.json": Object.fromEntries(rois.flatMap(roi => {
      const geometry = geometries[roi.id];
      return geometry ? [[roi.id, geometry]] : [];
    })),
    "catalogs/dimensions.json": aspectsCatalog,
    "catalogs/band.json": bands,
    "catalogs/measures.json": measures,
    "catalogs/sources.json": sources,
    "catalogs/statistics.json": {
      mean: defaultStatisticCatalog.mean,
      std: defaultStatisticCatalog.std,
      zscore: defaultStatisticCatalog.zscore,
    },
    ...Object.fromEntries(
      matrices.map((matrix) => [`matrices/${matrix.id}.json`, matrix]),
    ),
  });

  const subsetSize = 8;
  const simpleRois = legacy.matrix_order.slice(0, subsetSize).map((label, index) => ({
    index,
    label,
  }));
  const wanted = new Set([
    "study/delta/plv",
    "control/delta/plv",
    "study/theta/ciplv",
    "control/theta/ciplv",
    "zscore/delta/plv",
  ]);
  const simpleMatrices = legacy.matrices
    .filter((matrix) =>
      wanted.has([
        matrix.type_acronim,
        matrix.layer_acronim,
        matrix.measure_acronim,
      ].join("/")),
    )
    .flatMap((matrix) => {
      const isComparison = matrix.type_acronim === "zscore";
      const stat = isComparison ? "zscore" : "mean";
      return [{
        id: [
          isComparison ? "study-vs-control" : matrix.type_acronim,
          matrix.layer_acronim,
          matrix.measure_acronim,
          stat,
        ].join("-"),
        label: [
          isComparison ? "study vs control" : matrix.type_acronim,
          matrix.layer_acronim,
          matrix.measure_acronim,
          stat,
        ].join(" "),
        layout: "upper_triangular",
        source: isComparison ? "study-vs-control" : matrix.type_acronim,
        measure: matrix.measure_acronim,
        statistic: stat,
        dimensions: { band: matrix.layer_acronim },
        data: toUpperTriangular(topLeftSquare(matrix.mean, subsetSize)),
      }];
    });

  writeZip("05_simple_subset.zip", {
    "manifest.json": {
      formatVersion: "vafca-zip-v1",
      name: "Simple subset demo",
    },
    "rois.json": simpleRois,
    "catalogs/dimensions.json": aspectsCatalog,
    "catalogs/band.json": bands,
    "catalogs/measures.json": measures,
    "catalogs/sources.json": sources,
    "catalogs/statistics.json": {
      mean: defaultStatisticCatalog.mean,
      zscore: defaultStatisticCatalog.zscore,
    },
    ...Object.fromEntries(
      simpleMatrices.map((matrix) => [`matrices/${matrix.id}.json`, matrix]),
    ),
  });
}
