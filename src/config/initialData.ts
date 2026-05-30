export type InitialDataConfig = {
  loadInitialDataset: boolean;
  initialDatasetFile: InitialDataFile;
  loadTestAtlas: boolean;
  testAtlasFile: InitialDataFile;
};

export type InitialDataFile = {
  label: string;
  path: string;
};

export const initialDatasetFiles = {
  minimalMatrices: {
    label: "Minimal matrices",
    path: "data/examples/01_minimal_matrices.zip",
  },
  roisAndMatrices: {
    label: "ROIs and matrices",
    path: "data/examples/02_rois_and_matrices.zip",
  },
  matrixFolder: {
    label: "Matrix folder",
    path: "data/examples/03_matrix_folder.zip",
  },
  testDataTwoPopulationsZScore: {
    label: "test_Data 2 populations z-score",
    path: "data/examples/04_test_data_2_populations_z_score.zip",
  },
  simpleSubset: {
    label: "Simple subset",
    path: "data/examples/05_simple_subset.zip",
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
  loadInitialDataset: true,
  initialDatasetFile: initialDatasetFiles.testDataTwoPopulationsZScore,
  loadTestAtlas: true,
  testAtlasFile: testAtlasFiles.aal90WithoutMeshPoints,
};
