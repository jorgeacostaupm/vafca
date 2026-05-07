import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AtlasDefinition } from '@/types/atlas'
import {
  getDefaultGroupByFields,
  validateAtlasDefinition,
} from '@/utils/atlas/atlasDefinition'

export type AtlasDefinitionLoadError = {
  atlasId: string
  error: string
}

const DEFAULT_ATLAS_STATUS_ID = '__default_atlas__'

export type UploadAtlasPayload = {
  atlas: AtlasDefinition
  fileName: string
  commonFields: string[]
  defaultGroupFields: string[]
  compatibilityWarning?: string
}

export type UploadAtlasError = {
  error: string
}

export const loadDefaultAtlasDefinition = createAsyncThunk<
  {
    atlasId: string
    requestedAtlasId?: string
    atlas: AtlasDefinition | null
  },
  { atlasId?: string } | void,
  { rejectValue: AtlasDefinitionLoadError }
>(
  'atlasDefinition/loadDefaultAtlasDefinition',
  async (payload, { rejectWithValue }) => {
    const requestedAtlasId = payload?.atlasId
    const statusAtlasId = requestedAtlasId ?? DEFAULT_ATLAS_STATUS_ID

    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}data/atlas_3d_no_mesh_points.json`,
      )
      if (!response.ok) {
        return rejectWithValue({
          atlasId: statusAtlasId,
          error: `HTTP ${response.status}`,
        })
      }

      const atlasJson = (await response.json()) as AtlasDefinition
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

export const uploadAtlasDefinitionFromFile = createAsyncThunk<
  UploadAtlasPayload,
  { file: File },
  { rejectValue: UploadAtlasError }
>(
  'atlasDefinition/uploadAtlasDefinitionFromFile',
  async ({ file }, { rejectWithValue }) => {
    try {
      const raw = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        return rejectWithValue({ error: 'The file is not valid JSON.' })
      }

      const result = validateAtlasDefinition(parsed)
      if (!result.ok) {
        return rejectWithValue({ error: result.error })
      }

      return {
        atlas: result.atlas,
        fileName: file.name,
        commonFields: result.commonFields,
        defaultGroupFields: getDefaultGroupByFields(result.commonFields),
      }
    } catch (error) {
      return rejectWithValue({
        error:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred while loading the atlas.',
      })
    }
  },
)
