import { createAsyncThunk } from '@reduxjs/toolkit'
import type { ConnectivityDataset } from '@/types/datasets'
import type { DatasetMeta, MatrixStats } from '@/types/datasetState'
import type { RootState } from '@/types/store'
import { getAllMatrices, saveMatrices } from '@/utils/matrixStore'

const buildMatrixStats = (matrices: ConnectivityDataset['matrices']): MatrixStats => {
  const stats: MatrixStats = {
    total: matrices.length,
    byStat: {},
    byMeasure: {},
    byMeasureStatPopulation: {},
    byMeasureStatPopulationSet: {},
  }

  for (const matrix of matrices) {
    stats.byStat[matrix.statId] = (stats.byStat[matrix.statId] ?? 0) + 1
    stats.byMeasure[matrix.measureId] = (stats.byMeasure[matrix.measureId] ?? 0) + 1

    const measureEntry = stats.byMeasureStatPopulation[matrix.measureId] ?? {}
    const statEntry = measureEntry[matrix.statId] ?? {}

    for (const populationId of matrix.populationIds) {
      statEntry[populationId] = (statEntry[populationId] ?? 0) + 1
    }

    measureEntry[matrix.statId] = statEntry
    stats.byMeasureStatPopulation[matrix.measureId] = measureEntry

    const populationKey = [...matrix.populationIds].sort().join('+')
    const measureSetEntry = stats.byMeasureStatPopulationSet[matrix.measureId] ?? {}
    const statSetEntry = measureSetEntry[matrix.statId] ?? {}
    statSetEntry[populationKey] = (statSetEntry[populationKey] ?? 0) + 1
    measureSetEntry[matrix.statId] = statSetEntry
    stats.byMeasureStatPopulationSet[matrix.measureId] = measureSetEntry
  }

  return stats
}

export const loadTestDataset = createAsyncThunk<DatasetMeta>(
  'dataset/loadTestDataset',
  async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/testData.json`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const dataset = (await response.json()) as ConnectivityDataset
    await saveMatrices(dataset.matrices)

    return {
      metadata: dataset.metadata,
      catalogs: dataset.catalogs,
      matrixStats: buildMatrixStats(dataset.matrices),
    }
  },
)

export const downloadCurrentDataset = createAsyncThunk<
  { fileName: string },
  void,
  { state: RootState; rejectValue: string }
>('dataset/downloadCurrentDataset', async (_, { getState, rejectWithValue }) => {
  const data = getState().dataset.data
  if (!data) {
    return rejectWithValue('No dataset loaded yet.')
  }

  try {
    const matrices = await getAllMatrices()
    const payload = {
      metadata: data.metadata,
      catalogs: data.catalogs,
      matrices,
    }
    const datePart = new Date().toISOString().slice(0, 10)
    const fileName = `dataset-${datePart}.json`
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
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
