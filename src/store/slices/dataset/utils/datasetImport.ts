import type {
  DatasetMeta,
  NetworkImportError,
  NetworkImportSummary,
  NetworkStats,
} from '@/types/datasetState'
import type { NodeOrderItem } from '@/types/nodeOrder'
import {
  getDatasetNetworkStats,
  getDatasetNodeOrder,
} from '@/utils/datasetAccessors'
import {
  loadNetworkImport,
  loadNetworkImportFromBytes,
} from '@/utils/import/loadNetworkImport'
import type {
  NetworkImportMode,
  NetworkImportResult,
} from '@/utils/import/types'

export type ImportedDataset = {
  datasetMeta: DatasetMeta
  networkStats: NetworkStats
  nodeOrder: NodeOrderItem[]
  importResult: NetworkImportResult
  result: NetworkImportSummary
}

const toUploadError = (issue: {
  source: string
  path: string
  message: string
}): NetworkImportError => ({
  source: issue.source,
  message: `${issue.path}: ${issue.message}`,
})

const buildUploadResult = (
  imported: NetworkImportResult,
): NetworkImportSummary => {
  const errors = imported.normalized.issues.errors.map(toUploadError)
  return {
    files: 1,
    validNetworks: imported.normalized.networks.length,
    invalidNetworks: errors.length,
    errors,
    warnings: imported.normalized.issues.warnings.map(toUploadError),
  }
}

export const createImportedDataset = (
  imported: NetworkImportResult,
): ImportedDataset => {
  const datasetMeta = { content: imported.dataset }
  return {
    datasetMeta,
    networkStats: getDatasetNetworkStats(datasetMeta),
    nodeOrder: getDatasetNodeOrder(datasetMeta),
    importResult: imported,
    result: buildUploadResult(imported),
  }
}

export const importDatasetFromPublicZip = async (
  path: string,
  mode: NetworkImportMode,
) => {
  const response = await fetch(`${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const fileName = path.split('/').pop() ?? 'dataset.zip'
  return createImportedDataset(
    loadNetworkImportFromBytes(fileName, await response.arrayBuffer(), mode),
  )
}

export const importDatasetFromUploadedZip = async (
  file: File,
  mode: NetworkImportMode,
) => createImportedDataset(await loadNetworkImport(file, mode))
