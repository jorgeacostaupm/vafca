import type { NetworkCalculationBatchRequest, NetworkCalculationState } from './types'

export const isValidSampleSize = (n: unknown): n is number =>
  typeof n === 'number' && Number.isSafeInteger(n) && n > 1

export const populationSampleSize = (
  sourceId: string,
  request: NetworkCalculationBatchRequest,
  state: NetworkCalculationState,
) => request.sampleSizes?.[sourceId] ?? state.catalogs.sources[sourceId]?.n

export const requiredSampleSizeIds = (request: NetworkCalculationBatchRequest) =>
  [...new Set(request.operations.flatMap((operation) => {
    if (operation === 'population_one_sample_z_test') return [request.leftPopulationId]
    if (operation === 'population_cohens_d' || operation === 'population_welch_t' ||
      operation === 'population_two_sample_z_test') return [request.leftPopulationId, request.rightPopulationId]
    return []
  }))].filter((id): id is string => Boolean(id))

export const missingSampleSizeIds = (
  request: NetworkCalculationBatchRequest,
  state: NetworkCalculationState,
) => requiredSampleSizeIds(request).filter((id) =>
  !isValidSampleSize(populationSampleSize(id, request, state)),
)
