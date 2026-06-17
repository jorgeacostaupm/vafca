import { useAppSelector } from '@/store/hooks'
import { selectDatasetData, selectDatasetNetworkSummaries } from '@/store/slices/dataset'
import type { DatasetNetworkSummary } from '@/types/datasetNetworkView'

type DatasetNetworkSummariesStatus = 'idle' | 'loading' | 'ready' | 'error'

type DatasetNetworkSummariesResult = {
  summaries: DatasetNetworkSummary[]
  status: DatasetNetworkSummariesStatus
  error: string | null
}

export const useDatasetNetworkSummaries = (): DatasetNetworkSummariesResult => {
  const dataset = useAppSelector(selectDatasetData)
  const summaries = useAppSelector(selectDatasetNetworkSummaries)
  const status: DatasetNetworkSummariesStatus = dataset ? 'ready' : 'idle'

  return {
    summaries,
    status,
    error: null as string | null,
  }
}
