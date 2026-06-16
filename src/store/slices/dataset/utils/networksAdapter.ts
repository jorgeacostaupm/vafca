import { createEntityAdapter } from '@reduxjs/toolkit'

import type { Network } from '@/types/network'

export const networksAdapter = createEntityAdapter<Network, string>({
  selectId: (network) => network.id,
})
