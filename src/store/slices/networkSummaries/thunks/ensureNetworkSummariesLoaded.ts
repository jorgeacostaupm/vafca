import { createAsyncThunk } from '@reduxjs/toolkit'

import type { RootState } from '@/types/store'

import { loadNetworkSummaries } from './loadNetworkSummaries'

export const ensureNetworkSummariesLoaded = createAsyncThunk<
  void,
  { force?: boolean } | void,
  { state: RootState }
>(
  'networkSummaries/ensureNetworkSummariesLoaded',
  async (payload, { dispatch, getState }) => {
    const force = payload?.force ?? false
    const status = getState().networkSummaries.status
    if (!force && (status === 'loading' || status === 'ready')) {
      return
    }
    await dispatch(loadNetworkSummaries())
  },
)
