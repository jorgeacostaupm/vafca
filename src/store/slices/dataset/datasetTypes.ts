import type { DatasetState } from '@/types/datasetState'

import { networksAdapter } from './utils/networksAdapter'

export type DatasetSliceState = DatasetState

export const initialDatasetState: DatasetSliceState = {
  revision: 0,
  id: null,
  label: null,
  description: null,
  createdAt: null,
  nodeSet: null,
  catalogs: null,
  networks: networksAdapter.getInitialState(),
}
