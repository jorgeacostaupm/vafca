import { createListenerMiddleware } from '@reduxjs/toolkit'

import { RANKING_RECOMPUTE_DEBOUNCE_MS } from '@/config/ui'
import { enqueueNotification } from '@/store/slices/notifications'
import { rankingInputsChanged } from '@/store/slices/rankings/rankingInputSelectors'
import { recomputeRankingsForActiveFilters } from '@/store/slices/rankings/thunks/recomputeRankingsForActiveFilters'
import type { AppDispatch, RootState } from '@/types/store'

export const rankingFilterListenerMiddleware = createListenerMiddleware()
const startListening = rankingFilterListenerMiddleware.startListening.withTypes<RootState, AppDispatch>()

startListening({
  predicate: (_, current, previous) => rankingInputsChanged(current, previous),
  effect: async (_, api) => {
    api.cancelActiveListeners()
    await api.delay(RANKING_RECOMPUTE_DEBOUNCE_MS)
    const state = api.getState()
    if (!state.dataset.id || !state.rankings.resultsOrder.length) return
    const task = api.dispatch(recomputeRankingsForActiveFilters())
    const abort = () => task.abort()
    api.signal.addEventListener('abort', abort, { once: true })
    try {
      const result = await task
      if (recomputeRankingsForActiveFilters.rejected.match(result) && !result.meta.aborted) {
        api.dispatch(enqueueNotification({
          kind: 'error', message: result.payload ?? result.error.message ?? 'Failed to refresh rankings.',
        }))
      }
    } finally {
      api.signal.removeEventListener('abort', abort)
    }
  },
})
