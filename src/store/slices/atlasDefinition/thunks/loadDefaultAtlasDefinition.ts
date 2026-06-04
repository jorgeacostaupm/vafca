import { createAsyncThunk } from '@reduxjs/toolkit'

import type { AtlasDefinition } from '@/types/atlas'
import { validateAtlasDefinition } from '@/utils/atlas/atlasDefinition'

import {
  buildPublicDataUrl,
  DEFAULT_ATLAS_DEFINITION_PATH,
  DEFAULT_ATLAS_STATUS_ID,
} from '../utils/atlasDefinitionThunkUtils'

export type AtlasDefinitionLoadError = {
  atlasId: string
  error: string
}

export const loadDefaultAtlasDefinition = createAsyncThunk<
  {
    atlasId: string
    requestedAtlasId?: string
    atlas: AtlasDefinition | null
  },
  { atlasId?: string; path?: string } | void,
  { rejectValue: AtlasDefinitionLoadError }
>(
  'atlasDefinition/loadDefaultAtlasDefinition',
  async (payload, { rejectWithValue }) => {
    const requestedAtlasId = payload?.atlasId
    const statusAtlasId = requestedAtlasId ?? DEFAULT_ATLAS_STATUS_ID

    try {
      const response = await fetch(
        buildPublicDataUrl(payload?.path ?? DEFAULT_ATLAS_DEFINITION_PATH),
      )
      if (!response.ok) {
        return rejectWithValue({
          atlasId: statusAtlasId,
          error: `HTTP ${response.status}`,
        })
      }

      const result = validateAtlasDefinition(await response.json())
      if (!result.ok) {
        return rejectWithValue({
          atlasId: statusAtlasId,
          error: result.error,
        })
      }

      const atlasJson = result.atlas
      const atlasId = atlasJson.id ?? statusAtlasId

      return { atlasId, requestedAtlasId, atlas: atlasJson }
    } catch (error) {
      return rejectWithValue({
        atlasId: statusAtlasId,
        error: error instanceof Error ? error.message : 'Failed to load atlas.',
      })
    }
  },
)
