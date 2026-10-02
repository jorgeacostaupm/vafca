import { createAction } from '@reduxjs/toolkit'

import type { CatalogNetworkPrunePayload } from '@/store/slices/dataset/utils/catalogNetworkPruning'
import type { UpdateCatalogPayload } from '@/types/datasetState'

export const catalogItemUpdated = createAction<{
  update: UpdateCatalogPayload
  prune?: CatalogNetworkPrunePayload
  viewIds: string[]
}>('catalogs/itemUpdated')
