import { createAsyncThunk } from '@reduxjs/toolkit'

import { setUploadedAtlas } from '@/store/slices/atlasDefinition'
import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlasUi'
import type {
  DatasetMeta,
  NetworkImportRejected,
  NetworkImportSummary,
  NetworkStats,
} from '@/types/datasetState'
import type { NodeOrderItem } from '@/types/nodeOrder'
import { buildAtlasSourceFromNodeSet } from '@/utils/atlas/nodeDerivedAtlas'
import { normalizeNodeOrder } from '@/utils/nodeOrder'

import { setDataset } from '../datasetSlice'
import { importDatasetFromUploadedZip } from '../utils/datasetImport'

export const loadDatasetFromUploadedZip = createAsyncThunk<
  NetworkImportSummary & {
    datasetMeta: DatasetMeta
    networkStats: NetworkStats
    nodeOrder?: NodeOrderItem[] | null
    atlasCompatibilityWarning?: string
  },
  { files: File[]; resetAtlas?: boolean },
  { rejectValue: NetworkImportRejected }
>(
  'dataset/loadDatasetFromUploadedZip',
  async ({ files }, { dispatch, rejectWithValue }) => {
    if (files.length !== 1) {
      return rejectWithValue({ message: 'Load exactly one ZIP dataset.' })
    }
    try {
      const importedDataset = await importDatasetFromUploadedZip(files[0])
      const { datasetMeta, result } = importedDataset

      if (result.errors.length > 0) {
        return rejectWithValue({
          message:
            result.errors.map((error) => error.message).join(' ') ||
            'The file was not loaded.',
          result,
        })
      }

      dispatch(setDataset(datasetMeta))
      const atlasSource = buildAtlasSourceFromNodeSet(
        datasetMeta.content.nodeSet,
        files[0].name,
      )
      if (atlasSource) dispatch(setUploadedAtlas(atlasSource))
      dispatch(
        setAtlasLabels(buildAtlasState(normalizeNodeOrder(importedDataset.nodeOrder))),
      )

      return {
        ...result,
        datasetMeta,
        networkStats: importedDataset.networkStats,
        nodeOrder: importedDataset.nodeOrder,
      }
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'The file is not valid ZIP.',
      })
    }
  },
)
