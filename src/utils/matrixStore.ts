import type { ConnectivityMatrix } from '@/types/matrix'

export const createCompoundId = (
  matrix: Pick<ConnectivityMatrix, 'id' | 'layerId' | 'measureId' | 'statId' | 'populationIds'>
) => {
  const populations = [...matrix.populationIds].sort().join('+')
  return `${matrix.layerId}::${matrix.measureId}::${matrix.statId}::${populations || matrix.id}`
}
