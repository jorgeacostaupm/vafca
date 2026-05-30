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

mkdirSync(outputDir, { recursive: true });

writeZip("01_minimal_matrices.zip", {
  "matrices.json": [
    {
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
    defaults: {
      layer: "alpha",
      measure: "plv",
      stat: "mean",
      population: "control",
    },
  },
  "rois.json": [
    {
      index: 0,
      id: "frontal-l",
      label: "Frontal L",
      tags: {
        hemisphere: "left",
        lobe: "frontal",
        network: "DMN",
      },
    },
    {
      index: 1,
      id: "frontal-r",
      label: "Frontal R",
      tags: {
        hemisphere: "right",
        lobe: "frontal",
        network: "DMN",
      },
    },
    {
      index: 2,
      id: "temporal-l",
      label: "Temporal L",
      tags: {
        hemisphere: "left",
        lobe: "temporal",
        network: "SAL",
      },
    },
    {
      index: 3,
      id: "temporal-r",
      label: "Temporal R",
      tags: {
        hemisphere: "right",
        lobe: "temporal",
        network: "SAL",
      },
    },
  ],
  "catalogs/layers.json": { alpha: { label: "Alpha" } },
  "catalogs/measures.json": { plv: { label: "PLV", expectedRange: [0, 1] } },
  "catalogs/populations.json": { control: { label: "Control" } },
  "matrices.json": [
    {
      id: "alpha-control-mean",
      label: "Alpha control mean",
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
      stat: "std",
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
    defaults: {
      layer: "beta",
      measure: "coherence",
      stat: "mean",
      population: "dataset",
    },
  },
  "rois.json": [
    { index: 0, id: "roi-a", label: "ROI A", tags: { system: "A" } },
    { index: 1, id: "roi-b", label: "ROI B", tags: { system: "A" } },
    { index: 2, id: "roi-c", label: "ROI C", tags: { system: "B" } },
  ],
  "matrices/beta.json": {
    id: "beta-dataset",
    label: "Beta dataset",
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
    layer: "gamma",
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
  const atlasPath = new URL("../public/data/atlas_3d_no_mesh_points.json", import.meta.url);
  const atlas = existsSync(atlasPath)
    ? JSON.parse(readFileSync(atlasPath, "utf8"))
    : null;
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
      label,
      name: atlasRoi?.name ?? label,
      tags: atlasRoi?.tags ?? {},
    };
  });
  const layers = Object.fromEntries(
    legacy.layers.map((layer) => [
      layer.acronim,
      {
        label: layer.name,
        description: layer.description,
      },
    ]),
  );
  for (const layerId of ["max", "min", "mean"]) {
    layers[layerId] = { label: layerId.toUpperCase() };
  }

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
  const populations = Object.fromEntries(
    legacy.types.map((type) => [
      type.acronim,
      {
        label: type.name,
        description: type.description,
      },
    ]),
  );

  const isSquareMatrix = (value) =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((row) => Array.isArray(row) && row.length === value.length);

  const matrices = legacy.matrices.flatMap((matrix) => {
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
        kind: isComparison ? "comparison" : "population",
        layout: "upper_triangular",
        layer: matrix.layer_acronim,
        measure: matrix.measure_acronim,
        stat: isComparison ? "zscore" : stat,
        populationIds: isComparison ? ["study", "control"] : [matrix.type_acronim],
        comparison: isComparison
          ? {
              left: "study",
              right: "control",
              comparisonType: "zscore",
            }
          : undefined,
        data: toUpperTriangular(matrix[stat]),
      }));
  });

  writeZip("04_test_data_2_populations_z_score.zip", {
    "manifest.json": {
      formatVersion: "vafca-zip-v1",
      name: "test_Data_2_populations_z_score",
      atlasId: legacy.atlas,
      defaults: {
        layer: "delta",
        measure: "plv",
        stat: "mean",
        population: "study",
      },
    },
    "rois.json": rois,
    "catalogs/layers.json": layers,
    "catalogs/measures.json": measures,
    "catalogs/populations.json": populations,
    "catalogs/stats.json": {
      mean: { label: "Mean" },
      std: { label: "Standard deviation" },
      zscore: { label: "z-score" },
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
        kind: isComparison ? "comparison" : "population",
        layout: "upper_triangular",
        layer: matrix.layer_acronim,
        measure: matrix.measure_acronim,
        stat,
        populationIds: isComparison ? ["study", "control"] : [matrix.type_acronim],
        comparison: isComparison
          ? {
              left: "study",
              right: "control",
              comparisonType: "zscore",
            }
          : undefined,
        data: toUpperTriangular(topLeftSquare(matrix.mean, subsetSize)),
      }];
    });

  writeZip("05_simple_subset.zip", {
    "manifest.json": {
      formatVersion: "vafca-zip-v1",
      name: "Simple subset demo",
    },
    "rois.json": simpleRois,
    ...Object.fromEntries(
      simpleMatrices.map((matrix) => [`matrices/${matrix.id}.json`, matrix]),
    ),
  });
}
