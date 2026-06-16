import type { NetworkSummaryItem } from '@/types/networkViewStore'

export type NetworkSummariesStatus = 'idle' | 'loading' | 'ready' | 'error'

export type NetworkSummariesSliceState = {
  summaries: NetworkSummaryItem[]
  status: NetworkSummariesStatus
  error: string | null
}

export const initialNetworkSummariesState: NetworkSummariesSliceState = {
  summaries: [],
  status: 'idle',
  error: null,
}
