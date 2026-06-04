import { createAsyncThunk } from '@reduxjs/toolkit'

import type { DatasetMeta } from '@/types/datasetState'

import { setDataset } from '../datasetSlice'
import { importDatasetFromPublicZip } from '../utils/datasetImport'

const DEFAULT_INITIAL_DATASET_PATH = 'data/examples/02_rois_and_matrices.zip'

export type LoadInitialDatasetPayload = {
  path?: string
}

export const loadInitialDataset = createAsyncThunk<
  DatasetMeta,
  LoadInitialDatasetPayload | void
>('dataset/loadInitialDataset', async (payload, { dispatch }) => {
  const importedDataset = await importDatasetFromPublicZip(
    payload?.path ?? DEFAULT_INITIAL_DATASET_PATH,
    'lenient',
  )
  if (importedDataset.result.errors.length > 0) {
    throw new Error(importedDataset.result.errors[0]?.message)
  }
  dispatch(setDataset(importedDataset.datasetMeta))
  return importedDataset.datasetMeta
})
