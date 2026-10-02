import { createAsyncThunk } from '@reduxjs/toolkit'
import { zip } from 'fflate'

import type { RootState } from '@/types/store'
import { encodeDatasetEntries } from '@/workspace/datasetArchive'

import { selectDatasetContent } from '../datasetSelectors'

export const downloadCurrentDataset = createAsyncThunk<
  { fileName: string },
  void,
  { state: RootState; rejectValue: string }
>('dataset/downloadCurrentDataset', async (_, { getState, rejectWithValue }) => {
  const datasetContent = selectDatasetContent(getState())
  if (!datasetContent) {
    return rejectWithValue('No dataset loaded yet.')
  }

  try {
    const nodes = datasetContent.nodeSet.nodes
    if (datasetContent.networks.some(network =>
      network.nodeIds.length !== nodes.length || network.nodeIds.some((id, index) => id !== nodes[index].id),
    )) {
      return rejectWithValue('Some networks use a different ROI set. Export the workspace to preserve all networks.')
    }
    const { entries } = encodeDatasetEntries(datasetContent)
    const bytes = await new Promise<Uint8Array>((resolve, reject) =>
      zip(entries, (error, result) => error ? reject(error) : resolve(result)),
    )
    const datePart = new Date().toISOString().slice(0, 10)
    const fileName = `vafca-dataset-${datePart}.zip`
    const blob = new Blob([new Uint8Array(bytes)], {
      type: 'application/zip',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    try {
      link.click()
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 0)
    }
    return { fileName }
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to export dataset.',
    )
  }
})
