import type {
  DatasetMeta,
  MatrixStats,
  MatrixUploadError,
  MatrixUploadResult,
} from '@/types/datasetState'
import type { MatrixOrderItem } from '@/types/matrixOrder'
import { createDatasetMetaFromNormalized } from '@/utils/import/normalizedDatasetAdapter'
import {
  loadConnectivityImport,
  loadConnectivityImportFromBytes,
} from '@/utils/import/loadConnectivityImport'
import type {
  ConnectivityImportMode,
  ConnectivityImportResult,
} from '@/utils/import/types'
import {
  getDatasetMatrixOrder,
  getDatasetMatrixStats,
} from '@/utils/datasetAccessors'

export type ImportedDataset = {
  datasetMeta: DatasetMeta
  matrixStats: MatrixStats
  matrixOrder: MatrixOrderItem[]
  importResult: ConnectivityImportResult
  result: MatrixUploadResult
}

const toUploadError = (issue: {
  source: string
  path: string
  message: string
}): MatrixUploadError => ({
  source: issue.source,
  message: `${issue.path}: ${issue.message}`,
})

const buildUploadResult = (
  imported: ConnectivityImportResult,
): MatrixUploadResult => {
  const errors = imported.normalized.issues.errors.map(toUploadError)
  return {
    files: 1,
    validMatrices: imported.normalized.matrices.length,
    invalidMatrices: errors.length,
    errors,
    warnings: imported.normalized.issues.warnings.map(toUploadError),
  }
}

export const createImportedDataset = (
  imported: ConnectivityImportResult,
): ImportedDataset => {
  const datasetMeta = createDatasetMetaFromNormalized(imported.normalized)
  return {
    datasetMeta,
    matrixStats: getDatasetMatrixStats(datasetMeta),
    matrixOrder: getDatasetMatrixOrder(datasetMeta),
    importResult: imported,
    result: buildUploadResult(imported),
  }
}

export const importDatasetFromPublicZip = async (
  path: string,
  mode: ConnectivityImportMode,
) => {
  const response = await fetch(`${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const fileName = path.split('/').pop() ?? 'dataset.zip'
  return createImportedDataset(
    loadConnectivityImportFromBytes(fileName, await response.arrayBuffer(), mode),
  )
}

export const importDatasetFromUploadedZip = async (
  file: File,
  mode: ConnectivityImportMode,
) => createImportedDataset(await loadConnectivityImport(file, mode))
