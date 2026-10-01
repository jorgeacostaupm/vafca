import { createAsyncThunk } from '@reduxjs/toolkit'

import { setUploadedAtlas } from '@/store/slices/atlasDefinition'
import type { DatasetMeta } from '@/types/datasetState'
import { buildAtlasSourceFromNodeSet } from '@/utils/atlas/nodeDerivedAtlas'

import { setDataset } from '../datasetSlice'
import { importDatasetFromPublicZip } from '../utils/datasetImport'

const DEFAULT_INITIAL_DATASET_PATH = 'examples/use_case_1.zip'

export type LoadInitialDatasetPayload = {
  path?: string
}

export const loadInitialDataset = createAsyncThunk<DatasetMeta, LoadInitialDatasetPayload | void>(
  'dataset/loadInitialDataset',
  async (payload, { dispatch }) => {
    const importedDataset = await importDatasetFromPublicZip(
      payload?.path ?? DEFAULT_INITIAL_DATASET_PATH,
    )
    if (importedDataset.result.errors.length > 0) {
      throw new Error(importedDataset.result.errors[0]?.message)
    }
    dispatch(setDataset(importedDataset.datasetMeta))
    const atlasSource = buildAtlasSourceFromNodeSet(
      importedDataset.datasetMeta.content.nodeSet,
      importedDataset.importResult.normalized.source.fileName,
    )
    if (atlasSource) dispatch(setUploadedAtlas(atlasSource))
    return importedDataset.datasetMeta
  },
)
