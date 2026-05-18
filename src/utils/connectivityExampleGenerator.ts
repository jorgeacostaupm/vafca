import type {
  Atlas,
  Catalogs,
  ConnectivityBundle,
  MatrixCellValue,
  MatrixRecord,
  MatrixValueDomain,
  StatCatalogEntry,
} from "@/types/connectivityBundle";

const valueDomain: MatrixValueDomain = { min: 0, max: 1, center: null, units: null };
const expectedRange: [number, number] = [0, 1];

const round = (value: number) => Number(value.toFixed(6));

const pseudoRandom = (i: number, j: number, seed: number) => {
  const x = Math.sin((i + 1) * 127.1 + (j + 1) * 311.7 + seed * 74.7) * 43758.5453;
  return x - Math.floor(x);
};

export const createSymmetricDenseMatrix = (
  size: number,
  seed: number,
  options: { min?: number; max?: number } = {},
): MatrixCellValue[][] => {
  const min = options.min ?? 0.1;
  const max = options.max ?? 0.8;
  const data = Array.from({ length: size }, () => Array<MatrixCellValue>(size).fill(0));
  for (let i = 0; i < size; i += 1) {
    for (let j = i; j < size; j += 1) {
      const value = round(min + (max - min) * pseudoRandom(i, j, seed));
      data[i][j] = value;
      data[j][i] = value;
    }
  }
  return data;
};

export const createStdMatrix = (size: number, seed: number): MatrixCellValue[][] =>
  createSymmetricDenseMatrix(size, seed, { min: 0.02, max: 0.15 });

export const createSubjectMatrixFromMean = (
  meanMatrix: MatrixCellValue[][],
  seed: number,
): MatrixCellValue[][] => {
  const data = Array.from({ length: meanMatrix.length }, () =>
    Array<MatrixCellValue>(meanMatrix.length).fill(0),
  );

  for (let i = 0; i < meanMatrix.length; i += 1) {
    for (let j = i; j < meanMatrix.length; j += 1) {
      const noise = (pseudoRandom(i, j, seed) - 0.5) * 0.06;
      const value = round(
        Math.min(1, Math.max(0, Number(meanMatrix[i][j]) + noise)),
      );
      data[i][j] = value;
      data[j][i] = value;
    }
  }

  return data;
};

export const createStudyMatrixFromControl = (
  controlMeanMatrix: MatrixCellValue[][],
  seed: number,
): MatrixCellValue[][] => {
  const data = Array.from({ length: controlMeanMatrix.length }, () =>
    Array<MatrixCellValue>(controlMeanMatrix.length).fill(0),
  );

  for (let i = 0; i < controlMeanMatrix.length; i += 1) {
    for (let j = i; j < controlMeanMatrix.length; j += 1) {
      const shift = pseudoRandom(i, j, seed) > 0.5 ? 0.03 : -0.02;
      const value = round(
        Math.min(1, Math.max(0, Number(controlMeanMatrix[i][j]) + shift)),
      );
      data[i][j] = value;
      data[j][i] = value;
    }
  }

  return data;
};

export const toUpperTriangularData = (
  fullMatrix: MatrixCellValue[][],
): MatrixCellValue[] => {
  const data: MatrixCellValue[] = [];
  for (let i = 0; i < fullMatrix.length; i += 1) {
    for (let j = i; j < fullMatrix.length; j += 1) data.push(fullMatrix[i][j]);
  }
  return data;
};

export const toLowerTriangularData = (
  fullMatrix: MatrixCellValue[][],
): MatrixCellValue[] => {
  const data: MatrixCellValue[] = [];
  for (let i = 0; i < fullMatrix.length; i += 1) {
    for (let j = 0; j <= i; j += 1) data.push(fullMatrix[i][j]);
  }
  return data;
};

export const createAal90Atlas = (): Atlas => ({
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
    tags: {
      hemisphere: index % 2 === 0 ? "left" : "right",
      lobule: ["Frontal", "Parietal", "Temporal", "Occipital"][index % 4],
      network: null,
    },
    coords: null,
    metadata: {},
  })),
});

export const createBaseCatalogs = (
  params: {
    bands?: Array<"alpha" | "beta">;
    measures?: Array<"plv" | "ciplv">;
    stats?: string[];
    populations?: Record<string, number>;
    subjects?: Record<string, string[]>;
  } = {},
): Catalogs => {
  const bandEntries = {
    alpha: { id: "alpha", label: "Alpha", rangeHz: [8, 12] as [number, number], description: "Alpha band" },
    beta: { id: "beta", label: "Beta", rangeHz: [13, 30] as [number, number], description: "Beta band" },
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
  } satisfies Record<string, StatCatalogEntry>;
  const stats = params.stats ?? ["mean"];
  return {
    bands: Object.fromEntries((params.bands ?? ["alpha"]).map((id) => [id, bandEntries[id]])),
    measures: Object.fromEntries((params.measures ?? ["plv"]).map((id) => [id, measureEntries[id]])),
    stats: Object.fromEntries(
      stats.map((id) => [
        id,
        statEntries[id as keyof typeof statEntries] ?? {
          id,
          label: id,
          category: "descriptive",
          scaleType: "sequential" as const,
          center: null,
          rangeMode: "observed" as const,
        },
      ]),
    ),
    populations: Object.fromEntries(
      Object.entries(params.populations ?? { p_control: 10 }).map(([id, n]) => [
        id,
        {
          id,
          label: id === "p_control" ? "Control" : "Study",
          description: id === "p_control" ? "Control group" : "Study group",
          n,
          metadata: {},
        },
      ]),
    ),
    subjects: Object.fromEntries(
      Object.entries(params.subjects ?? {}).map(([id, populationIds]) => [
        id,
        { id, label: `Subject ${id.slice(1).padStart(3, "0")}`, populationIds, metadata: {} },
      ]),
    ),
    roiGroupSchemes: {},
  };
};

export const createMatrixRecord = (
  params: {
    id: string;
    kind: MatrixRecord["kind"];
    bandId: string;
    measureId: string;
    statId: string;
    data: MatrixRecord["data"];
    source: MatrixRecord["source"];
    layout?: MatrixRecord["encoding"]["layout"];
  },
): MatrixRecord => ({
  id: params.id,
  kind: params.kind,
  label: params.id,
  context: {
    bandId: params.bandId,
    measureId: params.measureId,
    conditionId: null,
    sessionId: null,
    taskId: null,
  },
  source: params.source,
  stat: { id: params.statId, method: params.statId === "mean" ? "arithmetic" : null, parameters: {} },
  geometry: { atlasId: "aal-90", shape: [90, 90], roiOrderRef: "atlas.rois", roiOrder: null },
  encoding: {
    layout: params.layout ?? "full",
    dtype: "float32",
    symmetric: true,
    missingValue: null,
  },
  valueDomain,
  provenance: {
    generatedBy: "test-generator",
    createdAt: null,
    software: "codex-generated",
    version: null,
    dependencies: [],
    parameters: {},
  },
  data: params.data,
});

export const createBundle = (
  id: string,
  label: string,
  catalogs: Catalogs,
  matrices: MatrixRecord[],
  atlas = createAal90Atlas(),
): ConnectivityBundle => ({
  schemaVersion: "fc-connectivity-v1.0",
  bundle: { id, label, description: label, createdAt: null },
  atlas,
  catalogs,
  matrices,
});

export const createExampleBundles = (): Record<string, unknown> => {
  const controlMean = createSymmetricDenseMatrix(90, 101, { min: 0.1, max: 0.8 });
  const controlStd = createStdMatrix(90, 102);
  const studyMean = createStudyMatrixFromControl(controlMean, 201);
  const studyStd = createStdMatrix(90, 202);
  const subject = createSubjectMatrixFromMean(controlMean, 301);
  const populationSource = (id: string, n: number) => ({ level: "population" as const, populationIds: [id], n });

  const bundle01 = createBundle("bundle_control_population", "Control population demo", createBaseCatalogs({ stats: ["mean", "std"], populations: { p_control: 10 } }), [
    createMatrixRecord({ id: "m_p_control_alpha_plv_mean", kind: "aggregate", bandId: "alpha", measureId: "plv", statId: "mean", source: populationSource("p_control", 10), data: controlMean }),
    createMatrixRecord({ id: "m_p_control_alpha_plv_std", kind: "aggregate", bandId: "alpha", measureId: "plv", statId: "std", source: populationSource("p_control", 10), data: controlStd }),
  ]);

  const bundle02 = createBundle("bundle_one_subject_study", "One subject study demo", createBaseCatalogs({ stats: ["value"], populations: { p_study: 10 }, subjects: { s001: ["p_study"] } }), [
    createMatrixRecord({ id: "m_s001_alpha_plv_value", kind: "subject", bandId: "alpha", measureId: "plv", statId: "value", source: { level: "subject", subjectId: "s001", populationIds: ["p_study"] }, data: subject }),
  ]);

  const bundle03 = createBundle("bundle_population_and_subject", "Population and subject demo", createBaseCatalogs({ stats: ["value", "mean", "std"], populations: { p_control: 10 }, subjects: { s001: ["p_control"] } }), [
    ...bundle01.matrices,
    createMatrixRecord({ id: "m_s001_alpha_plv_value", kind: "subject", bandId: "alpha", measureId: "plv", statId: "value", source: { level: "subject", subjectId: "s001", populationIds: ["p_control"] }, data: subject }),
  ]);

  const bundle04 = createBundle("bundle_two_populations", "Two populations demo", createBaseCatalogs({ stats: ["mean", "std"], populations: { p_control: 10, p_study: 20 } }), [
    ...bundle01.matrices,
    createMatrixRecord({ id: "m_p_study_alpha_plv_mean", kind: "aggregate", bandId: "alpha", measureId: "plv", statId: "mean", source: populationSource("p_study", 20), data: studyMean }),
    createMatrixRecord({ id: "m_p_study_alpha_plv_std", kind: "aggregate", bandId: "alpha", measureId: "plv", statId: "std", source: populationSource("p_study", 20), data: studyStd }),
  ]);

  const bundle05 = createBundle("bundle_beta_study", "Beta band study demo", createBaseCatalogs({ bands: ["beta"], stats: ["mean", "std"], populations: { p_study: 10 } }), [
    createMatrixRecord({ id: "m_p_study_beta_plv_mean", kind: "aggregate", bandId: "beta", measureId: "plv", statId: "mean", source: populationSource("p_study", 10), data: studyMean }),
    createMatrixRecord({ id: "m_p_study_beta_plv_std", kind: "aggregate", bandId: "beta", measureId: "plv", statId: "std", source: populationSource("p_study", 10), data: studyStd }),
  ]);

  const bundle06 = createBundle("bundle_ciplv_study", "ciPLV study demo", createBaseCatalogs({ measures: ["ciplv"], stats: ["mean", "std"], populations: { p_study: 10 } }), [
    createMatrixRecord({ id: "m_p_study_alpha_ciplv_mean", kind: "aggregate", bandId: "alpha", measureId: "ciplv", statId: "mean", source: populationSource("p_study", 10), data: studyMean }),
    createMatrixRecord({ id: "m_p_study_alpha_ciplv_std", kind: "aggregate", bandId: "alpha", measureId: "ciplv", statId: "std", source: populationSource("p_study", 10), data: studyStd }),
  ]);

  const swappedAtlas = createAal90Atlas();
  [swappedAtlas.rois[0].index, swappedAtlas.rois[1].index] = [
    swappedAtlas.rois[1].index,
    swappedAtlas.rois[0].index,
  ];

  return {
    "01_one_population_control.json": bundle01,
    "02_one_subject_study.json": bundle02,
    "03_population_and_subject.json": bundle03,
    "04_two_populations.json": bundle04,
    "05_different_band_warning.json": bundle05,
    "06_different_measure_warning.json": bundle06,
    "07_incompatible_roi_order_error.json": createBundle("bundle_swapped_roi_order", "Swapped ROI order demo", bundle01.catalogs, bundle01.matrices, swappedAtlas),
    "08_upper_triangular_layout.json": createBundle("bundle_upper_triangular", "Upper triangular demo", createBaseCatalogs({ stats: ["mean"], populations: { p_control: 10 } }), [
      createMatrixRecord({ id: "m_p_control_alpha_plv_mean_upper", kind: "aggregate", bandId: "alpha", measureId: "plv", statId: "mean", source: populationSource("p_control", 10), layout: "upper_triangular", data: toUpperTriangularData(controlMean) }),
    ]),
    "09_lower_triangular_layout.json": createBundle("bundle_lower_triangular", "Lower triangular demo", createBaseCatalogs({ stats: ["mean"], populations: { p_control: 10 } }), [
      createMatrixRecord({ id: "m_p_control_alpha_plv_mean_lower", kind: "aggregate", bandId: "alpha", measureId: "plv", statId: "mean", source: populationSource("p_control", 10), layout: "lower_triangular", data: toLowerTriangularData(controlMean) }),
    ]),
    "10_invalid_old_format.json": { matrices: [{ id: "old_matrix", bandId: "alpha", measureId: "plv", statId: "mean", populationIds: ["p_control"], size: 90, matrix: controlMean }] },
    "11_invalid_shape.json": { ...bundle01, bundle: { ...bundle01.bundle, id: "bundle_invalid_shape" }, matrices: [{ ...bundle01.matrices[0], geometry: { ...bundle01.matrices[0].geometry, shape: [89, 89] } }] },
    "12_invalid_data_length.json": { ...bundle01, bundle: { ...bundle01.bundle, id: "bundle_invalid_data_length" }, matrices: [{ ...bundle01.matrices[0], data: controlMean.slice(0, 89) }] },
    "13_duplicate_matrix_id.json": { ...bundle01, bundle: { ...bundle01.bundle, id: "bundle_duplicate_matrix_id" }, matrices: [bundle01.matrices[0], { ...bundle01.matrices[1], id: bundle01.matrices[0].id }] },
  };
};

export const writeExampleBundles = () => createExampleBundles();
