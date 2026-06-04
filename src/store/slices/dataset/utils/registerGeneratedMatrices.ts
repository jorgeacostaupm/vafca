import { getMatrixCalculationMethodDefinitions } from '@/networkDerivation/calculations/methods'
import type { MatrixCalculationOutputSpec } from '@/networkDerivation/calculations/types'
import type { ConnectivityMatrix, StatCatalogEntry } from '@/types/connectivityBundle'
import type { DatasetState } from '@/types/datasetState'

import { matricesAdapter } from './matricesAdapter'

const AGGREGATED_MEAN_STAT: StatCatalogEntry = {
  id: 'mean',
  label: 'Mean',
  category: 'aggregation',
  scaleType: 'sequential',
  center: null,
  rangeMode: 'observed',
  enabled: true,
  useDataRange: true,
}

const outputByStatId = Object.fromEntries(
  getMatrixCalculationMethodDefinitions()
    .flatMap((definition) => [
      ...definition.outputs,
      ...(definition.associatedOutputs?.flatMap((item) => item.outputs) ?? []),
    ])
    .map((output) => [output.statId, output]),
) as Record<string, MatrixCalculationOutputSpec>

const statCatalogEntryFromOutput = (
  output: MatrixCalculationOutputSpec,
): StatCatalogEntry => ({
  id: output.statId,
  label: output.statLabel,
  category: output.statCategory,
  description: output.description,
  scaleType: output.scaleType,
  center: output.center,
  rangeMode: output.rangeMode,
  expectedRange: output.expectedRange,
  enabled: true,
  useDataRange: output.useDataRange,
})

const registerGeneratedStatCatalogEntries = (
  state: DatasetState,
  matrices: ConnectivityMatrix[],
) => {
  const { stats } = state.catalogs ?? {}
  if (!stats) return

  matrices.forEach((matrix) => {
    const output = outputByStatId[matrix.stat.id]
    if (output) {
      stats[output.statId] = statCatalogEntryFromOutput(output)
      return
    }

    if (matrix.kind === 'aggregated' && matrix.stat.id === AGGREGATED_MEAN_STAT.id) {
      stats[AGGREGATED_MEAN_STAT.id] = AGGREGATED_MEAN_STAT
    }
  })
}

const registerAggregatedLayerCatalogEntries = (
  state: DatasetState,
  matrices: ConnectivityMatrix[],
) => {
  const { catalogs } = state
  if (!catalogs) return

  matrices.forEach((matrix) => {
    if (matrix.kind !== 'aggregated') return
    const layerId = matrix.context.layerId
    if (!layerId) return

    const baseMatrix = matrix.aggregation?.baseMatrixId
      ? state.matrices.entities[matrix.aggregation.baseMatrixId]
      : undefined
    const baseLayerId = baseMatrix?.context.layerId ?? null
    const baseLayerLabel =
      (baseLayerId ? catalogs.layers[baseLayerId]?.label : undefined) ??
      baseLayerId ??
      'No layer'
    const groupingLabel = matrix.aggregation?.fields.join(' / ') || 'ROI groups'

    catalogs.layers[layerId] = {
      id: layerId,
      label: `${baseLayerLabel} by ${groupingLabel}`,
      description: `Visualization-only layer derived from ${baseLayerLabel}.`,
      enabled: true,
    }
  })
}

export const registerGeneratedMatricesInDataset = (
  state: DatasetState,
  matrices: ConnectivityMatrix[],
) => {
  matricesAdapter.upsertMany(state.matrices, matrices)
  registerGeneratedStatCatalogEntries(state, matrices)
  registerAggregatedLayerCatalogEntries(state, matrices)
}
