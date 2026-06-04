import type { MatrixViewData } from '@/types/connectivityBundle'

export const createCompoundId = (
  matrix: Pick<MatrixViewData, 'id' | 'layerId' | 'measureId' | 'statId' | 'populationIds'>
) => {
  const populations = [...matrix.populationIds].sort().join('+')
  return `${matrix.layerId}::${matrix.measureId}::${matrix.statId}::${populations || matrix.id}`
}
