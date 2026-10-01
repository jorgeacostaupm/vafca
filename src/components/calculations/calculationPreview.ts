import { absoluteCalculationOutput } from '@/networkDerivation/calculations/absoluteDifference'
import { dimensionLabel } from '@/networkDerivation/calculations/dimensions'
import { inputStatisticsLabel } from '@/networkDerivation/calculations/inputStatistics'
import { assertContextCompatible, resolveCalculationInputsForDimensions } from '@/networkDerivation/calculations/resolution'
import { missingSampleSizeIds } from '@/networkDerivation/calculations/sampleSizes'
import type { NetworkCalculationBatchRequest, NetworkCalculationMethodDefinition, NetworkCalculationState } from '@/networkDerivation/calculations/types'

export type CalculationPreviewRow = {
  key: string
  request: NetworkCalculationBatchRequest
  method: string
  dimensions: string
  measure: string
  left: string
  right: string
  inputs: string
  output: string
  status: string
}

export function calculationPreview(
  request: NetworkCalculationBatchRequest,
  state: NetworkCalculationState,
  methods: NetworkCalculationMethodDefinition[],
): CalculationPreviewRow[] {
  return request.operations.flatMap((operation) => {
    const definition = methods.find((method) => method.id === operation)
    const subjects = operation.startsWith('subject_') ? request.subjectIds ?? [] : [undefined]
    return subjects.flatMap((subjectId) => request.dimensionPairs.flatMap((pair, index) =>
      request.measureIds.map((measureId) => {
        const resolved = resolveCalculationInputsForDimensions({ ...request, operation }, state, pair, measureId, subjectId)
        let status = resolved.missingRoles.length ? `skipped: missing ${resolved.missingRoles.join(', ')}` : 'ready'
        if (status === 'ready') {
          try { assertContextCompatible(Object.values(resolved.networks)) }
          catch (error) { status = `skipped: ${error instanceof Error ? error.message : 'Incompatible networks'}` }
          if (resolved.warnings.length) status = `skipped: ${resolved.warnings.join('; ')}`
          const missing = missingSampleSizeIds({ ...request, operations: [operation] }, state)
          if (status === 'ready' && missing.length) status = `missing n: ${missing.map((id) => state.catalogs.sources[id]?.label ?? id).join(', ')}`
        }
        const leftId = subjectId ?? request.leftPopulationId
        const rightId = operation === 'subject_difference' ? request.rightSubjectId
          : operation === 'population_one_sample_z_test' || operation === 'subject_zscore_vs_population'
            ? request.referencePopulationId : request.rightPopulationId
        return {
          request: { ...request, operations: [operation], dimensionPairs: [pair], measureIds: [measureId],
            subjectIds: subjectId ? [subjectId] : request.subjectIds },
          key: `${operation}:${subjectId ?? 'pop'}:${index}:${measureId}`,
          method: definition?.shortLabel ?? operation,
          dimensions: `${dimensionLabel(state.catalogs, pair.left)} → ${dimensionLabel(state.catalogs, pair.right)}`,
          measure: state.catalogs.measures[measureId]?.label ?? measureId,
          left: leftId ? state.catalogs.sources[leftId]?.label ?? leftId : '',
          right: rightId ? state.catalogs.sources[rightId]?.label ?? rightId : '',
          inputs: definition ? inputStatisticsLabel(request, definition, state.catalogs) : '',
          output: definition?.outputs[0] ? (request.absoluteDifference
            ? absoluteCalculationOutput(definition.outputs[0]) : definition.outputs[0]).statisticId : '',
          status,
        }
      }).filter((row) => !row.status.startsWith('skipped:')),
    ))
  })
}
