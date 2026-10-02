import { absoluteCalculationOutput } from '@/networkDerivation/calculations/absoluteDifference'
import { dimensionLabel, sameDimensions } from '@/networkDerivation/calculations/dimensions'
import { inputStatisticsLabel } from '@/networkDerivation/calculations/inputStatistics'
import { assertContextCompatible, resolveCalculationInputsForDimensions } from '@/networkDerivation/calculations/resolution'
import { missingSampleSizeIds, populationSampleSize } from '@/networkDerivation/calculations/sampleSizes'
import type { NetworkCalculationBatchRequest, NetworkCalculationMethodDefinition, NetworkCalculationState } from '@/networkDerivation/calculations/types'

export type CalculationPreviewRow = {
  calculated: boolean
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
        const output = definition?.outputs[0] ? (request.absoluteDifference
          ? absoluteCalculationOutput(definition.outputs[0]) : definition.outputs[0]).statisticId : ''
        const dependencies = Object.values(resolved.networks).map((network) => network.id)
        // ponytail: scan existing networks per preview row; index comparison metadata if previews grow large.
        const calculated = status === 'ready' && state.networks.some((network) => {
          const derivation = network.derivation
          if (derivation?.type !== 'comparison' || network.measureId !== measureId ||
            network.statisticId !== output || derivation.parameters?.methodId !== operation) return false
          if (!sameDimensions(network.dimensions, pair.left) ||
            !sameDimensions((derivation.parameters.rightDimensions ?? network.dimensions) as Record<string, string>, pair.right)) return false
          if (derivation.parameters.left !== leftId || derivation.parameters.right !== rightId) return false
          if (operation === 'population_two_sample_z_test' &&
            derivation.parameters.hypothesizedDifference !== (request.hypothesizedDifference ?? 0)) return false
          if (!dependencies.every((id) => network.provenance.dependencies.includes(id))) return false
          if (operation === 'population_one_sample_z_test') {
            return derivation.parameters.nTarget === populationSampleSize(leftId!, request, state)
          }
          if (['population_two_sample_z_test', 'population_cohens_d', 'population_welch_t'].includes(operation)) {
            return derivation.parameters.nLeft === populationSampleSize(leftId!, request, state) &&
              derivation.parameters.nRight === populationSampleSize(rightId!, request, state)
          }
          return true
        })
        return {
          calculated,
          request: { ...request, operations: [operation], dimensionPairs: [pair], measureIds: [measureId],
            subjectIds: subjectId ? [subjectId] : request.subjectIds },
          key: `${operation}:${subjectId ?? 'pop'}:${index}:${measureId}`,
          method: definition?.shortLabel ?? operation,
          dimensions: sameDimensions(pair.left, pair.right) ? dimensionLabel(state.catalogs, pair.left)
            : `${dimensionLabel(state.catalogs, pair.left)} → ${dimensionLabel(state.catalogs, pair.right)}`,
          measure: state.catalogs.measures[measureId]?.label ?? measureId,
          left: leftId ? state.catalogs.sources[leftId]?.label ?? leftId : '',
          right: rightId ? state.catalogs.sources[rightId]?.label ?? rightId : '',
          inputs: definition ? inputStatisticsLabel(request, definition, state.catalogs) : '',
          output,
          status,
        }
      }).filter((row) => !row.status.startsWith('skipped:')),
    ))
  })
}
