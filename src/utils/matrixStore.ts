import type { ConnectivityMatrix } from '@/types/matrix'

type StoredMatrix = ConnectivityMatrix & { compoundId: string }

export type MatrixSummary = {
  compoundId: string
  bandId: string
  measureId: string
  statId: string
  populationIds: string[]
  size: number
}

const inMemoryMatrices = new Map<string, StoredMatrix>()

export const createCompoundId = (
  matrix: Pick<ConnectivityMatrix, 'bandId' | 'measureId' | 'statId' | 'populationIds'>
) => {
  const populations = [...matrix.populationIds].sort().join('+')
  return `${matrix.bandId}::${matrix.measureId}::${matrix.statId}::${populations}`
}

export const saveMatrices = async (matrices: ConnectivityMatrix[]) => {
  inMemoryMatrices.clear()
  for (const matrix of matrices) {
    const compoundId = createCompoundId(matrix)
    const record: StoredMatrix = { ...matrix, compoundId }
    inMemoryMatrices.set(compoundId, record)
  }
}

export const getMatrix = async (compoundId: string): Promise<StoredMatrix | undefined> => {
  return inMemoryMatrices.get(compoundId)
}

export const getAllMatrixSummaries = async (): Promise<MatrixSummary[]> => {
  return Array.from(inMemoryMatrices.values()).map((record) => ({
    compoundId: record.compoundId,
    bandId: record.bandId,
    measureId: record.measureId,
    statId: record.statId,
    populationIds: record.populationIds,
    size: record.data.length,
  }))
}

export const getAllMatrices = async (): Promise<ConnectivityMatrix[]> => {
  return Array.from(inMemoryMatrices.values()).map(({ compoundId, ...matrix }) => matrix)
}
