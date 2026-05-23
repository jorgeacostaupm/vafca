import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MatrixRecord } from '@/types/connectivityBundle'
import type {
  DatasetMeta,
  UpdateCatalogPayload,
  UpdateMetadataPayload,
} from '@/types/datasetState'
import { buildMatrixStats } from '@/utils/matrixStats'
import { materializeMatrixData } from '@/utils/connectivityMatrix'
import { getMatrixPopulationIds } from '@/utils/matrixSource'
import {
  computeAggregatedMatrixFromVisualizationGroups,
  computeDerivedMatrices,
  downloadCurrentDataset,
  loadTestDataset,
  uploadMatricesIntoDataset,
} from './datasetThunks'
import { initialDatasetState } from './datasetTypes'

const DERIVED_STAT_CATALOG = {
  zscore: {
    id: 'zscore',
    label: 'z-score',
    scaleType: 'diverging',
    center: 0,
    rangeMode: 'observed_symmetric',
    useDataRange: true,
  },
  difference: {
    id: 'difference',
    label: 'Difference',
    min: -1,
    max: 1,
    scaleType: 'diverging',
    center: 0,
    rangeMode: 'observed_symmetric',
    useDataRange: true,
  },
  cohens_d: {
    id: 'cohens_d',
    label: "Cohen's d",
    scaleType: 'diverging',
    center: 0,
    rangeMode: 'observed_symmetric',
    useDataRange: true,
  },
  z_value: {
    id: 'z_value',
    label: 'Z value',
    scaleType: 'diverging',
    center: 0,
    rangeMode: 'observed_symmetric',
    useDataRange: true,
  },
  t_value: {
    id: 't_value',
    label: 't value',
    scaleType: 'diverging',
    center: 0,
    rangeMode: 'observed_symmetric',
    useDataRange: true,
  },
  p_value: {
    id: 'p_value',
    label: 'p-value',
    min: 0,
    max: 1,
    scaleType: 'sequential',
    center: null,
    rangeMode: 'fixed',
  },
  mean: {
    id: 'mean',
    label: 'Mean',
    scaleType: 'sequential',
    center: null,
    rangeMode: 'observed',
    useDataRange: true,
  },
} as const

const toConnectivityMatrix = (matrix: MatrixRecord) => ({
  id: matrix.id,
  layerId: matrix.context.layerId ?? 'none',
  measureId: matrix.context.measureId,
  statId: matrix.stat.id,
  populationIds: getMatrixPopulationIds(matrix),
  data: materializeMatrixData(matrix),
  dataStats: matrix.dataStats,
})

const addDerivedStatsToCatalogs = (data: DatasetMeta, matrices: MatrixRecord[]) => {
  matrices.forEach((matrix) => {
    const stat = DERIVED_STAT_CATALOG[matrix.stat.id as keyof typeof DERIVED_STAT_CATALOG]
    if (!stat) return
    data.catalogs.stats[stat.id] = {
      ...stat,
      enabled: true,
    }
    if (data.connectivity) {
      data.connectivity.catalogs.stats[stat.id] = {
        id: stat.id,
        label: stat.label,
        category: 'derived',
        scaleType: stat.scaleType,
        center: stat.center,
        rangeMode: stat.rangeMode,
        expectedRange:
          stat.id === 'p_value'
            ? [0, 1]
            : stat.id === 'difference'
              ? [-1, 1]
              : undefined,
      }
    }
  })
}

const addReducedLayersToCatalogs = (data: DatasetMeta, matrices: MatrixRecord[]) => {
  const connectivity = data.connectivity
  matrices.forEach((matrix) => {
    if (matrix.kind !== 'reduced') return
    const layerId = matrix.context.layerId
    if (!layerId) return

    const baseMatrix = matrix.reduction?.baseMatrixId
      ? connectivity?.matrixIndex[matrix.reduction.baseMatrixId]
      : undefined
    const baseLayerId = baseMatrix?.context.layerId ?? null
    const baseLayerLabel =
      (baseLayerId
        ? connectivity?.catalogs.layers[baseLayerId]?.label ??
          data.catalogs.layers[baseLayerId]?.label
        : undefined) ??
      baseLayerId ??
      'No layer'
    const groupingLabel = matrix.reduction?.fields.join(' / ') || 'ROI groups'
    const label = `${baseLayerLabel} by ${groupingLabel}`
    const description = `Visualization-only layer derived from ${baseLayerLabel}.`

    data.catalogs.layers[layerId] = {
      id: layerId,
      label,
      description,
      enabled: true,
    }
    if (connectivity) {
      connectivity.catalogs.layers[layerId] = {
        id: layerId,
        label,
        description,
      }
    }
  })
}

const datasetSlice = createSlice({
  name: 'dataset',
  initialState: initialDatasetState,
  reducers: {
    setDataset(state, action: PayloadAction<DatasetMeta>) {
      state.data = action.payload
      state.status = 'ready'
      state.error = null
      state.downloadStatus = 'idle'
      state.downloadError = null
      state.matrixUploadStatus = 'idle'
      state.matrixUploadError = null
      state.lastMatrixUpload = null
      state.derivedCalculationStatus = 'idle'
      state.derivedCalculationError = null
    },
    clearDataset(state) {
      state.data = null
      state.status = 'idle'
      state.error = null
      state.downloadStatus = 'idle'
      state.downloadError = null
      state.matrixUploadStatus = 'idle'
      state.matrixUploadError = null
      state.lastMatrixUpload = null
      state.derivedCalculationStatus = 'idle'
      state.derivedCalculationError = null
    },
    updateCatalogItem(state, action: PayloadAction<UpdateCatalogPayload>) {
      if (!state.data) return
      const { catalog, id, changes } = action.payload
      const catalogMap = state.data.catalogs[catalog] as Record<
        string,
        Record<string, unknown>
      >
      const existing = catalogMap[id]
      if (!existing) return
      catalogMap[id] = { ...existing, ...changes }
    },
    updateMetadata(state, action: PayloadAction<UpdateMetadataPayload>) {
      if (!state.data) return
      state.data.metadata = { ...state.data.metadata, ...action.payload.changes }
    },
    addDerivedMatrices(state, action: PayloadAction<MatrixRecord[]>) {
      if (!state.data?.connectivity || action.payload.length === 0) return
      const connectivity = state.data.connectivity
      action.payload.forEach((matrix) => {
        connectivity.matrices.push(matrix)
        connectivity.matrixIndex[matrix.id] = matrix
      })
      addDerivedStatsToCatalogs(state.data, action.payload)
      addReducedLayersToCatalogs(state.data, action.payload)
      state.data.matrixStats = buildMatrixStats(
        connectivity.matrices.map(toConnectivityMatrix),
      )
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTestDataset.pending, (state) => {
        state.status = 'loading'
        state.error = null
        state.downloadStatus = 'idle'
        state.downloadError = null
        state.matrixUploadStatus = 'idle'
        state.matrixUploadError = null
        state.lastMatrixUpload = null
        state.derivedCalculationStatus = 'idle'
        state.derivedCalculationError = null
      })
      .addCase(loadTestDataset.fulfilled, (state, action) => {
        state.status = 'ready'
        state.data = action.payload
        state.downloadStatus = 'idle'
        state.downloadError = null
      })
      .addCase(loadTestDataset.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.error.message ?? 'Failed to load dataset.'
      })
      .addCase(downloadCurrentDataset.pending, (state) => {
        state.downloadStatus = 'loading'
        state.downloadError = null
      })
      .addCase(downloadCurrentDataset.fulfilled, (state) => {
        state.downloadStatus = 'ready'
        state.downloadError = null
      })
      .addCase(downloadCurrentDataset.rejected, (state, action) => {
        state.downloadStatus = 'error'
        state.downloadError =
          action.payload ?? action.error.message ?? 'Failed to export dataset.'
      })
      .addCase(uploadMatricesIntoDataset.pending, (state) => {
        state.matrixUploadStatus = 'loading'
        state.matrixUploadError = null
        state.lastMatrixUpload = null
      })
      .addCase(uploadMatricesIntoDataset.fulfilled, (state, action) => {
        state.data = action.payload.datasetMeta
        state.data.matrixStats = action.payload.matrixStats
        if (action.payload.matrixOrder) {
          state.data.metadata = {
            ...state.data.metadata,
            matrixOrder: action.payload.matrixOrder,
          }
        }
        state.matrixUploadStatus = 'ready'
        state.matrixUploadError = null
        state.lastMatrixUpload = {
          files: action.payload.files,
          validMatrices: action.payload.validMatrices,
          invalidMatrices: action.payload.invalidMatrices,
          errors: action.payload.errors,
          warnings: action.payload.warnings,
        }
      })
      .addCase(uploadMatricesIntoDataset.rejected, (state, action) => {
        state.matrixUploadStatus = 'error'
        state.matrixUploadError =
          action.payload ?? action.error.message ?? 'Failed to upload matrices.'
        state.lastMatrixUpload = null
      })
      .addCase(computeDerivedMatrices.pending, (state) => {
        state.derivedCalculationStatus = 'loading'
        state.derivedCalculationError = null
      })
      .addCase(computeDerivedMatrices.fulfilled, (state, action) => {
        state.derivedCalculationStatus = 'ready'
        state.derivedCalculationError = null
        if (!state.data?.connectivity || action.payload.matrices.length === 0) return
        const connectivity = state.data.connectivity
        action.payload.matrices.forEach((matrix) => {
          connectivity.matrices.push(matrix)
          connectivity.matrixIndex[matrix.id] = matrix
        })
        addDerivedStatsToCatalogs(state.data, action.payload.matrices)
        addReducedLayersToCatalogs(state.data, action.payload.matrices)
        state.data.matrixStats = buildMatrixStats(
          connectivity.matrices.map(toConnectivityMatrix),
        )
      })
      .addCase(computeDerivedMatrices.rejected, (state, action) => {
        state.derivedCalculationStatus = 'error'
        state.derivedCalculationError =
          action.payload ?? action.error.message ?? 'Failed to compute derived matrices.'
      })
      .addCase(computeAggregatedMatrixFromVisualizationGroups.pending, (state) => {
        state.derivedCalculationStatus = 'loading'
        state.derivedCalculationError = null
      })
      .addCase(computeAggregatedMatrixFromVisualizationGroups.fulfilled, (state, action) => {
        state.derivedCalculationStatus = 'ready'
        state.derivedCalculationError = null
        const matrices = action.payload.matrices
        if (!state.data?.connectivity || matrices.length === 0) return
        const connectivity = state.data.connectivity
        matrices.forEach((matrix) => {
          connectivity.matrices.push(matrix)
          connectivity.matrixIndex[matrix.id] = matrix
        })
        addDerivedStatsToCatalogs(state.data, matrices)
        addReducedLayersToCatalogs(state.data, matrices)
        state.data.matrixStats = buildMatrixStats(
          connectivity.matrices.map(toConnectivityMatrix),
        )
      })
      .addCase(computeAggregatedMatrixFromVisualizationGroups.rejected, (state, action) => {
        state.derivedCalculationStatus = 'error'
        state.derivedCalculationError =
          action.payload ?? action.error.message ?? 'Failed to compute aggregated matrix.'
      })
  },
})

export const {
  addDerivedMatrices,
  setDataset,
  clearDataset,
  updateCatalogItem,
  updateMetadata,
} =
  datasetSlice.actions

export default datasetSlice.reducer
