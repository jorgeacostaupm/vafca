export type InitialDataConfig = {
  loadTestDataset: boolean;
  testDatasetFile: InitialDataFile;
  loadTestAtlas: boolean;
  testAtlasFile: InitialDataFile;
};

export type InitialDataFile = {
  label: string;
  path: string;
};

export const testDatasetFiles = {
  onePopulationControl: {
    label: "One population control",
    path: "data/examples/01_one_population_control.json",
  },
  oneSubjectStudy: {
    label: "One subject study",
    path: "data/examples/02_one_subject_study.json",
  },
  populationAndSubject: {
    label: "Population and subject",
    path: "data/examples/03_population_and_subject.json",
  },
  twoPopulations: {
    label: "Two populations",
    path: "data/examples/04_two_populations.json",
  },
  betaBandStudy: {
    label: "Beta band study",
    path: "data/examples/05_different_band_warning.json",
  },
  ciPlvStudy: {
    label: "ciPLV study",
    path: "data/examples/06_different_measure_warning.json",
  },
  swappedRoiOrder: {
    label: "Swapped ROI order",
    path: "data/examples/07_incompatible_roi_order_error.json",
  },
  upperTriangular: {
    label: "Upper triangular layout",
    path: "data/examples/08_upper_triangular_layout.json",
  },
  lowerTriangular: {
    label: "Lower triangular layout",
    path: "data/examples/09_lower_triangular_layout.json",
  },
  testDataFullZscore: {
    label: "testData with z-score",
    path: "data/examples/14_testdata_full_zscore.json",
  },
  testDataWithoutZscore: {
    label: "testData without z-score",
    path: "data/examples/15_testdata_without_zscore.json",
  },
} satisfies Record<string, InitialDataFile>;

export const testAtlasFiles = {
  aal90WithoutMeshPoints: {
    label: "AAL 90 without mesh points",
    path: "data/atlas_3d_no_mesh_points.json",
  },
  aal90WithMeshPoints: {
    label: "AAL 90 with mesh points",
    path: "data/atlas_3d.json",
  },
} satisfies Record<string, InitialDataFile>;

export const initialDataConfig: InitialDataConfig = {
  loadTestDataset: true,
  testDatasetFile: testDatasetFiles.testDataFullZscore,
  loadTestAtlas: true,
  testAtlasFile: testAtlasFiles.aal90WithoutMeshPoints,
};
