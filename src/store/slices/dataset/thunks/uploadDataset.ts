import { createAsyncThunk } from '@reduxjs/toolkit'

import { setUploadedAtlas } from '@/store/slices/atlasDefinition'
import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlasUi'
import type { AtlasDefinition } from '@/types/atlas'
import type {
  DatasetMeta,
  MatrixStats,
  MatrixUploadRejected,
  MatrixUploadResult,
} from '@/types/datasetState'
import type { MatrixOrderItem } from '@/types/matrixOrder'
import type { ConnectivityImportMode } from '@/utils/import/types'
import { normalizeMatrixOrder } from '@/utils/matrixOrder'

import { setDataset } from '../datasetSlice'
import { importDatasetFromUploadedZip } from '../utils/datasetImport'

export const loadDatasetFromUploadedZip = createAsyncThunk<
  MatrixUploadResult & {
    datasetMeta: DatasetMeta
    matrixStats: MatrixStats
    matrixOrder?: MatrixOrderItem[] | null
    atlasCompatibilityWarning?: string
  },
  { files: File[]; resetAtlas?: boolean; mode?: ConnectivityImportMode },
  { rejectValue: MatrixUploadRejected }
>(
  'dataset/loadDatasetFromUploadedZip',
  async ({ files, mode = 'lenient' }, { dispatch, rejectWithValue }) => {
    if (files.length !== 1) {
      return rejectWithValue({ message: 'Load exactly one ZIP dataset.' })
    }
    try {
      const importedDataset = await importDatasetFromUploadedZip(files[0], mode)
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
      dispatch(
        setUploadedAtlas({
          atlas: {
            id: datasetMeta.content.atlas.id,
            name: datasetMeta.content.atlas.name,
            rois: datasetMeta.content.atlas.rois.map((roi) => ({
              ...roi,
              tags: roi.tags as AtlasDefinition['rois'][number]['tags'],
              coords: roi.coords as AtlasDefinition['rois'][number]['coords'],
              metadata: roi.metadata,
            })),
          } satisfies AtlasDefinition,
          fileName: files[0].name,
        }),
      )
      dispatch(
        setAtlasLabels(buildAtlasState(normalizeMatrixOrder(importedDataset.matrixOrder))),
      )

      return {
        ...result,
        datasetMeta,
        matrixStats: importedDataset.matrixStats,
        matrixOrder: importedDataset.matrixOrder,
      }
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : 'The file is not valid ZIP.',
      })
    }
  },
)
