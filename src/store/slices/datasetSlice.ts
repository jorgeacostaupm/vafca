import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ConnectivityDataset } from '@/types/datasets'
import type { ConnectivityCatalogs } from '@/types/catalogs'
import { saveMatrices } from '@/utils/matrixStore'

type MatrixStats = {
  total: number
  byStat: Record<string, number>
  byMeasure: Record<string, number>
  byMeasureStatPopulation: Record<string, Record<string, Record<string, number>>>
  byMeasureStatPopulationSet: Record<string, Record<string, Record<string, number>>>
}

type DatasetMeta = {
  metadata: ConnectivityDataset['metadata']
  catalogs: ConnectivityDataset['catalogs']
  matrixStats: MatrixStats
}

export type DatasetState = {
  data: DatasetMeta | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
}

type UpdateCatalogPayload = {
  catalog: keyof ConnectivityCatalogs
  id: string
  changes: Partial<ConnectivityCatalogs[keyof ConnectivityCatalogs][string]>
}

type UpdateMetadataPayload = {
  changes: Partial<ConnectivityDataset['metadata']>
}

const initialState: DatasetState = {
  data: null,
  status: 'idle',
  error: null,
}

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

    const populationKey = [...matrix.populationIds].sort().join("+")
    const measureSetEntry =
      stats.byMeasureStatPopulationSet[matrix.measureId] ?? {}
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
  }
)

const datasetSlice = createSlice({
  name: 'dataset',
  initialState,
  reducers: {
    setDataset(state, action: PayloadAction<DatasetMeta>) {
      state.data = action.payload
      state.status = 'ready'
      state.error = null
    },
    clearDataset(state) {
      state.data = null
      state.status = 'idle'
      state.error = null
    },
    updateCatalogItem(state, action: PayloadAction<UpdateCatalogPayload>) {
      if (!state.data) return
      const { catalog, id, changes } = action.payload
      const catalogMap = state.data.catalogs[catalog] as Record<string, Record<string, unknown>>
      const existing = catalogMap[id]
      if (!existing) return
      catalogMap[id] = { ...existing, ...changes }
    },
    updateMetadata(state, action: PayloadAction<UpdateMetadataPayload>) {
      if (!state.data) return
      state.data.metadata = { ...state.data.metadata, ...action.payload.changes }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTestDataset.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadTestDataset.fulfilled, (state, action) => {
        state.status = 'ready'
        state.data = action.payload
      })
      .addCase(loadTestDataset.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.error.message ?? 'Failed to load dataset.'
      })
  },
})

export const { setDataset, clearDataset, updateCatalogItem, updateMetadata } =
  datasetSlice.actions

export default datasetSlice.reducer
