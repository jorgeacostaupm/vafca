import { createAsyncThunk } from '@reduxjs/toolkit'

import type { AtlasDefinition } from '@/types/atlas'
import type { RootState } from '@/types/store'
import { validateAtlasDefinition } from '@/utils/atlas/atlasDefinition'
import { buildAtlasSourceFromNodeSet } from '@/utils/atlas/nodeDerivedAtlas'

import {
  buildPublicDataUrl,
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
  { state: RootState; rejectValue: AtlasDefinitionLoadError }
>(
  'atlasDefinition/loadDefaultAtlasDefinition',
  async (payload, { getState, rejectWithValue }) => {
    const requestedAtlasId = payload?.atlasId
    const statusAtlasId = requestedAtlasId ?? DEFAULT_ATLAS_STATUS_ID

    try {
      if (!payload?.path) {
        const source = buildAtlasSourceFromNodeSet(getState().dataset.nodeSet ?? undefined, 'Dataset ROIs');
        return { atlasId: source?.atlas.id ?? statusAtlasId, requestedAtlasId, atlas: source?.atlas ?? null };
      }
      const response = await fetch(
        buildPublicDataUrl(payload.path),
      )
      if (!response.ok) {
        return rejectWithValue({
          atlasId: statusAtlasId,
          error: `HTTP ${response.status}`,
        })
      }

      const raw: unknown = await response.json()
      const result = validateAtlasDefinition(raw)
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
