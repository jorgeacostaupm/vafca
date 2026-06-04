import { createAsyncThunk } from '@reduxjs/toolkit'

import type { RootState } from '@/types/store'

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
    const datePart = new Date().toISOString().slice(0, 10)
    const fileName = `normalized-dataset-${datePart}.json`
    const blob = new Blob([JSON.stringify(datasetContent, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
    return { fileName }
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to export dataset.',
    )
  }
})
