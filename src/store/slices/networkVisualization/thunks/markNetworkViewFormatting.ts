import { selectDatasetData } from '@/store/slices/dataset'
import type { AppDispatch, RootState } from '@/types/store'
import { getMaterializedNetworkByCompoundId } from '@/utils/datasetAccessors'

import { setNetworkViewStatus } from '../networkVisualizationSlice'
import type { NetworkViewFormattingError } from '../networkVisualizationTypes'

export const markNetworkViewFormatting =
  ({ viewId }: { viewId: string }) =>
  (
    dispatch: AppDispatch,
    getState: () => RootState,
  ): { viewId: string } | NetworkViewFormattingError => {
    dispatch(setNetworkViewStatus({ viewId, status: 'formatting' }))

    const target = getState().networkVisualization.viewsById[viewId]
    if (!target) {
      const payload = { viewId, error: 'View not found.' }
      dispatch(setNetworkViewStatus({ ...payload, status: 'error' }))
      return payload
    }

    const networkView = getMaterializedNetworkByCompoundId(
      selectDatasetData(getState()),
      target.compoundId,
    )
    if (!networkView) {
      const payload = { viewId, error: 'Network not found in store.' }
      dispatch(setNetworkViewStatus({ ...payload, status: 'error' }))
      return payload
    }

    dispatch(setNetworkViewStatus({ viewId, status: 'ready' }))
    return { viewId }
  }
