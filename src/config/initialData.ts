export type InitialDataConfig = {
  loadInitialDataset: boolean
  initialDatasetFile: InitialDataFile
}

export type InitialDataFile = {
  label: string
  path: string
  from?: string
}

export const initialDatasetFiles = {
  useCase1: {
    label: 'Wirsich dataset',
    path: 'examples/use_case_1.zip',
    from: 'https://doi.org/10.5281/zenodo.10470710',
  },
} satisfies Record<string, InitialDataFile>

export const initialDataConfig: InitialDataConfig = {
  loadInitialDataset: true,
  initialDatasetFile: initialDatasetFiles.useCase1,
}
