import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(root, "public/data/examples");
const valueDomain = { min: 0, max: 1, center: null, units: null };
const expectedRange = [0, 1];

const round = (value) => Number(value.toFixed(6));
const pseudoRandom = (i, j, seed) => {
  const x = Math.sin((i + 1) * 127.1 + (j + 1) * 311.7 + seed * 74.7) * 43758.5453;
  return x - Math.floor(x);
};
const createSymmetricDenseMatrix = (size, seed, min = 0.1, max = 0.8) => {
  const data = Array.from({ length: size }, () => Array(size).fill(0));
  for (let i = 0; i < size; i += 1) {
    for (let j = i; j < size; j += 1) {
      const value = round(min + (max - min) * pseudoRandom(i, j, seed));
      data[i][j] = value;
      data[j][i] = value;
    }
  }
  return data;
};
const createStdMatrix = (size, seed) => createSymmetricDenseMatrix(size, seed, 0.02, 0.15);
const createSubjectMatrixFromMean = (mean, seed) => {
  const data = Array.from({ length: mean.length }, () => Array(mean.length).fill(0));
  for (let i = 0; i < mean.length; i += 1) {
    for (let j = i; j < mean.length; j += 1) {
      const value = round(Math.min(1, Math.max(0, mean[i][j] + (pseudoRandom(i, j, seed) - 0.5) * 0.06)));
      data[i][j] = value;
      data[j][i] = value;
    }
  }
  return data;
};
const createStudyMatrixFromControl = (mean, seed) => {
  const data = Array.from({ length: mean.length }, () => Array(mean.length).fill(0));
  for (let i = 0; i < mean.length; i += 1) {
    for (let j = i; j < mean.length; j += 1) {
      const value = round(Math.min(1, Math.max(0, mean[i][j] + (pseudoRandom(i, j, seed) > 0.5 ? 0.03 : -0.02))));
      data[i][j] = value;
      data[j][i] = value;
    }
  }
  return data;
};
const toUpperTriangularData = (full) => {
  const data = [];
  for (let i = 0; i < full.length; i += 1) for (let j = i; j < full.length; j += 1) data.push(full[i][j]);
  return data;
};
const toLowerTriangularData = (full) => {
  const data = [];
  for (let i = 0; i < full.length; i += 1) for (let j = 0; j <= i; j += 1) data.push(full[i][j]);
  return data;
};
const createAal90Atlas = () => ({
  id: "aal-90",
  name: "AI-MIND AAL 90 ROIs",
  description: "Base AI-MIND AAL 90 ROIs atlas",
  version: "1.0.0",
  space: "MNI",
  coordinateSystem: "MNI152",
  rois: Array.from({ length: 90 }, (_, index) => ({
    index,
    id: `aal90_${String(index).padStart(3, "0")}`,
    atlasId: index,
    name: `AAL 90 ROI ${String(index + 1).padStart(3, "0")}`,
    label: `ROI ${index + 1}`,
    tags: { hemisphere: index % 2 === 0 ? "left" : "right", lobule: ["Frontal", "Parietal", "Temporal", "Occipital"][index % 4], network: null },
    coords: null,
    metadata: {},
  })),
});
const createCatalogs = ({ layers = ["alpha"], measures = ["plv"], stats = ["mean"], populations = { p_control: 10 }, subjects = {} } = {}) => {
  const layerEntries = {
    alpha: { id: "alpha", label: "Alpha", description: "Alpha layer (8-12 Hz)" },
    beta: { id: "beta", label: "Beta", description: "Beta layer (13-30 Hz)" },
  };
  const measureEntries = {
    plv: { id: "plv", label: "PLV", description: "Phase Locking Value", expectedRange, symmetric: true, directed: false },
    ciplv: { id: "ciplv", label: "ciPLV", description: "Corrected imaginary PLV", expectedRange, symmetric: true, directed: false },
  };
  const statEntries = {
    value: { id: "value", label: "Value", category: "subject", scaleType: "sequential", center: null, rangeMode: "inherit_measure" },
    mean: { id: "mean", label: "Mean", category: "descriptive", scaleType: "sequential", center: null, rangeMode: "inherit_measure" },
    std: { id: "std", label: "Standard deviation", category: "dispersion", scaleType: "sequential", center: null, rangeMode: "non_negative_observed" },
    difference: { id: "difference", label: "Difference", category: "comparison", scaleType: "diverging", center: 0, rangeMode: "observed_symmetric" },
    zscore: { id: "zscore", label: "Z-score", category: "standardized", scaleType: "diverging", center: 0, rangeMode: "observed_symmetric" },
    cohens_d: { id: "cohens_d", label: "Cohen's d", category: "effect_size", scaleType: "diverging", center: 0, rangeMode: "observed_symmetric" },
    t_value: { id: "t_value", label: "t-value", category: "inferential", scaleType: "diverging", center: 0, rangeMode: "observed_symmetric" },
    p_value: { id: "p_value", label: "p-value", category: "inferential", scaleType: "sequential", center: null, rangeMode: "fixed", expectedRange },
    q_value: { id: "q_value", label: "q-value", category: "corrected_inferential", scaleType: "sequential", center: null, rangeMode: "fixed", expectedRange },
  };
  return {
    layers: Object.fromEntries(layers.map((id) => [id, layerEntries[id]])),
    measures: Object.fromEntries(measures.map((id) => [id, measureEntries[id]])),
    stats: Object.fromEntries(stats.map((id) => [id, statEntries[id] ?? {
      id,
      label: id,
      category: "descriptive",
      scaleType: "sequential",
      center: null,
      rangeMode: "observed",
    }])),
    populations: Object.fromEntries(Object.entries(populations).map(([id, n]) => [id, { id, label: id === "p_control" ? "Control" : "Study", description: id === "p_control" ? "Control group" : "Study group", n, metadata: {} }])),
    subjects: Object.fromEntries(Object.entries(subjects).map(([id, populationIds]) => [id, { id, label: `Subject ${id.slice(1).padStart(3, "0")}`, populationIds, metadata: {} }])),
    roiGroupSchemes: {},
  };
};
const matrix = ({ id, kind, layerId, measureId, statId, source, data, layout = "full" }) => ({
  id,
  kind,
  label: id,
  context: { layerId, measureId, conditionId: null, sessionId: null, taskId: null },
  source,
  stat: { id: statId, method: statId === "mean" ? "arithmetic" : null, parameters: {} },
  geometry: { atlasId: "aal-90", shape: [90, 90], roiOrderRef: "atlas.rois", roiOrder: null },
  encoding: { layout, dtype: "float32", symmetric: true, missingValue: null },
  valueDomain,
  provenance: { generatedBy: "test-generator", createdAt: null, software: "codex-generated", version: null, dependencies: [], parameters: {} },
  data,
});
const bundle = (id, label, catalogs, matrices, atlas = createAal90Atlas()) => ({
  schemaVersion: "fc-connectivity-v1.0",
  bundle: { id, label, description: label, createdAt: null },
  atlas,
  catalogs,
  matrices,
});

const controlMean = createSymmetricDenseMatrix(90, 101);
const controlStd = createStdMatrix(90, 102);
const studyMean = createStudyMatrixFromControl(controlMean, 201);
const studyStd = createStdMatrix(90, 202);
const subject = createSubjectMatrixFromMean(controlMean, 301);
const population = (id, n) => ({ level: "population", populationIds: [id], n });
const b01 = bundle("bundle_control_population", "Control population demo", createCatalogs({ stats: ["mean", "std"], populations: { p_control: 10 } }), [
  matrix({ id: "m_p_control_alpha_plv_mean", kind: "aggregate", layerId: "alpha", measureId: "plv", statId: "mean", source: population("p_control", 10), data: controlMean }),
  matrix({ id: "m_p_control_alpha_plv_std", kind: "aggregate", layerId: "alpha", measureId: "plv", statId: "std", source: population("p_control", 10), data: controlStd }),
]);
const swappedAtlas = createAal90Atlas();
[swappedAtlas.rois[0].index, swappedAtlas.rois[1].index] = [swappedAtlas.rois[1].index, swappedAtlas.rois[0].index];
const files = {
  "01_one_population_control.json": b01,
  "02_one_subject_study.json": bundle("bundle_one_subject_study", "One subject study demo", createCatalogs({ stats: ["value"], populations: { p_study: 10 }, subjects: { s001: ["p_study"] } }), [
    matrix({ id: "m_s001_alpha_plv_value", kind: "subject", layerId: "alpha", measureId: "plv", statId: "value", source: { level: "subject", subjectId: "s001", populationIds: ["p_study"] }, data: subject }),
  ]),
  "03_population_and_subject.json": bundle("bundle_population_and_subject", "Population and subject demo", createCatalogs({ stats: ["value", "mean", "std"], populations: { p_control: 10 }, subjects: { s001: ["p_control"] } }), [...b01.matrices, matrix({ id: "m_s001_alpha_plv_value", kind: "subject", layerId: "alpha", measureId: "plv", statId: "value", source: { level: "subject", subjectId: "s001", populationIds: ["p_control"] }, data: subject })]),
  "04_two_populations.json": bundle("bundle_two_populations", "Two populations demo", createCatalogs({ stats: ["mean", "std"], populations: { p_control: 10, p_study: 20 } }), [...b01.matrices, matrix({ id: "m_p_study_alpha_plv_mean", kind: "aggregate", layerId: "alpha", measureId: "plv", statId: "mean", source: population("p_study", 20), data: studyMean }), matrix({ id: "m_p_study_alpha_plv_std", kind: "aggregate", layerId: "alpha", measureId: "plv", statId: "std", source: population("p_study", 20), data: studyStd })]),
  "05_different_layer_warning.json": bundle("bundle_beta_study", "Beta layer study demo", createCatalogs({ layers: ["beta"], stats: ["mean", "std"], populations: { p_study: 10 } }), [matrix({ id: "m_p_study_beta_plv_mean", kind: "aggregate", layerId: "beta", measureId: "plv", statId: "mean", source: population("p_study", 10), data: studyMean }), matrix({ id: "m_p_study_beta_plv_std", kind: "aggregate", layerId: "beta", measureId: "plv", statId: "std", source: population("p_study", 10), data: studyStd })]),
  "06_different_measure_warning.json": bundle("bundle_ciplv_study", "ciPLV study demo", createCatalogs({ measures: ["ciplv"], stats: ["mean", "std"], populations: { p_study: 10 } }), [matrix({ id: "m_p_study_alpha_ciplv_mean", kind: "aggregate", layerId: "alpha", measureId: "ciplv", statId: "mean", source: population("p_study", 10), data: studyMean }), matrix({ id: "m_p_study_alpha_ciplv_std", kind: "aggregate", layerId: "alpha", measureId: "ciplv", statId: "std", source: population("p_study", 10), data: studyStd })]),
  "07_incompatible_roi_order_error.json": bundle("bundle_swapped_roi_order", "Swapped ROI order demo", b01.catalogs, b01.matrices, swappedAtlas),
  "08_upper_triangular_layout.json": bundle("bundle_upper_triangular", "Upper triangular demo", createCatalogs({ stats: ["mean"], populations: { p_control: 10 } }), [matrix({ id: "m_p_control_alpha_plv_mean_upper", kind: "aggregate", layerId: "alpha", measureId: "plv", statId: "mean", source: population("p_control", 10), layout: "upper_triangular", data: toUpperTriangularData(controlMean) })]),
  "09_lower_triangular_layout.json": bundle("bundle_lower_triangular", "Lower triangular demo", createCatalogs({ stats: ["mean"], populations: { p_control: 10 } }), [matrix({ id: "m_p_control_alpha_plv_mean_lower", kind: "aggregate", layerId: "alpha", measureId: "plv", statId: "mean", source: population("p_control", 10), layout: "lower_triangular", data: toLowerTriangularData(controlMean) })]),
  "10_invalid_old_format.json": { matrices: [{ id: "old_matrix", layerId: "alpha", measureId: "plv", statId: "mean", populationIds: ["p_control"], size: 90, matrix: controlMean }] },
  "11_invalid_shape.json": { ...b01, bundle: { ...b01.bundle, id: "bundle_invalid_shape" }, matrices: [{ ...b01.matrices[0], geometry: { ...b01.matrices[0].geometry, shape: [89, 89] } }] },
  "12_invalid_data_length.json": { ...b01, bundle: { ...b01.bundle, id: "bundle_invalid_data_length" }, matrices: [{ ...b01.matrices[0], data: controlMean.slice(0, 89) }] },
  "13_duplicate_matrix_id.json": { ...b01, bundle: { ...b01.bundle, id: "bundle_duplicate_matrix_id" }, matrices: [b01.matrices[0], { ...b01.matrices[1], id: b01.matrices[0].id }] },
};

await mkdir(outputDir, { recursive: true });
await Promise.all(Object.entries(files).map(([name, payload]) => writeFile(resolve(outputDir, name), `${JSON.stringify(payload, null, 2)}\n`)));
console.log(`Wrote ${Object.keys(files).length} example bundles to ${outputDir}`);
