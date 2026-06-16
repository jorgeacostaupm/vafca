import { createAsyncThunk } from '@reduxjs/toolkit'

import { setUploadedAtlas } from '@/store/slices/atlasDefinition'
import { buildAtlasState, setAtlasLabels } from '@/store/slices/atlasUi'
import type { AtlasDefinition } from '@/types/atlas'
import type {
  DatasetMeta,
  NetworkImportRejected,
  NetworkImportSummary,
  NetworkStats,
} from '@/types/datasetState'
import type { NodeOrderItem } from '@/types/nodeOrder'
import type { NetworkImportMode } from '@/utils/import/types'
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
  { files: File[]; resetAtlas?: boolean; mode?: NetworkImportMode },
  { rejectValue: NetworkImportRejected }
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
            id: datasetMeta.content.nodeSet.id,
            name: datasetMeta.content.nodeSet.label,
            nodes: datasetMeta.content.nodeSet.nodes.map((node, index) => ({
              index: node.index ?? index,
              id: node.id,
              atlasId: node.index ?? index,
              name: node.name ?? node.label,
              label: node.label,
              tags: node.tags as AtlasDefinition['nodes'][number]['tags'],
              coords: node.coords as AtlasDefinition['nodes'][number]['coords'],
              metadata: node.metadata,
            })),
          } satisfies AtlasDefinition,
          fileName: files[0].name,
        }),
      )
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
