import type { ConnectivityMetadata, ConnectivityCatalogs } from '@/types/catalogs'
import type { ConnectivityMatrix } from '@/types/matrix'

export type ConnectivityDataset = {
  metadata: ConnectivityMetadata
  catalogs: ConnectivityCatalogs
  matrices: ConnectivityMatrix[]
}
