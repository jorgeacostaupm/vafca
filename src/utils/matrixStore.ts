import type { ConnectivityMatrix } from '@/types/matrix'
import type { MatrixSummary, StoredMatrix } from '@/types/matrixStore'


const inMemoryMatrices = new Map<string, StoredMatrix>()

export const createCompoundId = (
  matrix: Pick<ConnectivityMatrix, 'id' | 'bandId' | 'measureId' | 'statId' | 'populationIds'>
) => {
  const populations = [...matrix.populationIds].sort().join('+')
  return `${matrix.bandId}::${matrix.measureId}::${matrix.statId}::${populations || matrix.id}`
}

export const saveMatrices = async (matrices: ConnectivityMatrix[]) => {
  inMemoryMatrices.clear()
  for (const matrix of matrices) {
    const compoundId = createCompoundId(matrix)
    const record: StoredMatrix = { ...matrix, compoundId }
    inMemoryMatrices.set(compoundId, record)
  }
}

export const clearMatrices = async () => {
  inMemoryMatrices.clear()
}

export const upsertMatrices = async (matrices: ConnectivityMatrix[]) => {
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
  return Array.from(inMemoryMatrices.values()).map((record) => ({
    id: record.id,
    bandId: record.bandId,
    measureId: record.measureId,
    statId: record.statId,
    populationIds: record.populationIds,
    data: record.data,
    dataStats: record.dataStats,
  }))
}
