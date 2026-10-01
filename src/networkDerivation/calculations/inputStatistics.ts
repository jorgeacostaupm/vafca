import type { Catalogs } from '@/types/network'

import type {
  CalculationInputRole,
  NetworkCalculationBatchRequest,
  NetworkCalculationInputSpec,
  NetworkCalculationMethodDefinition,
  NetworkCalculationOperation,
} from './types'

export const inputStatisticId = (
  request: NetworkCalculationBatchRequest,
  operation: NetworkCalculationOperation,
  input: NetworkCalculationInputSpec,
) => request.inputStatistics?.[operation]?.[input.role] ?? input.statisticId

export const inputSourceId = (
  role: CalculationInputRole,
  request: NetworkCalculationBatchRequest,
  subjectId?: string,
) => {
  switch (role) {
    case 'subjectValue':
    case 'leftSubjectValue': return subjectId
    case 'rightSubjectValue': return request.rightSubjectId
    case 'referenceMean':
    case 'referenceStd': return request.referencePopulationId ?? request.rightPopulationId
    case 'rightMean':
    case 'rightStd':
    case 'rightValue': return request.rightPopulationId
    default: return request.leftPopulationId
  }
}

export const methodInputStatistics = (
  request: NetworkCalculationBatchRequest,
  method: NetworkCalculationMethodDefinition,
) => Object.fromEntries(method.requiredInputs.map((input) =>
  [input.role, inputStatisticId(request, method.id, input)],
))

export const inputStatisticsLabel = (
  request: NetworkCalculationBatchRequest,
  method: NetworkCalculationMethodDefinition,
  catalogs: Catalogs,
) => method.requiredInputs.map((input) => {
  const id = inputStatisticId(request, method.id, input)
  return `${input.label}: ${id ? catalogs.statistics[id]?.label ?? id : 'not selected'}`
}).join('; ')
