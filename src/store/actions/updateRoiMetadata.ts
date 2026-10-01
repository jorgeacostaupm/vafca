import { createAction } from '@reduxjs/toolkit'

import { NodeMetadataSchema } from '@/utils/atlas/nodeMetadata'

export const updateRoiMetadata = createAction(
  'nodes/updateMetadata',
  (payload: { id: string; atlasId: string; nodeSetId: string | null; metadata: Record<string, unknown> }) => ({
    payload: { ...payload, metadata: NodeMetadataSchema.parse({ metadata: payload.metadata }) },
  }),
)
