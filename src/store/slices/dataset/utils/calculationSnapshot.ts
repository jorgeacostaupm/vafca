import type { RootState } from '@/types/store'

export type DatasetCalculationConfig = {
  state: RootState
  rejectValue: string
  fulfilledMeta: { datasetRevision: number }
}

export const assertCalculationCurrent = (
  getState: () => RootState,
  revision: number,
  signal: AbortSignal,
) => {
  signal.throwIfAborted()
  if (getState().dataset.revision !== revision) {
    throw new Error('The dataset changed during the calculation. Run it again.')
  }
}
