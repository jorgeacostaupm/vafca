import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AtlasDefinition, AtlasMeshMode } from '@/types/atlas'
import {
  atlasSupports3d,
  countRoisWithoutValidMeshPoints,
  getDefaultGroupByFields,
  validateAtlasDefinition,
} from '@/utils/atlas/atlasDefinition'

export type AtlasDefinitionLoadError = {
  atlasId: string
  error: string
}

export type UploadAtlasPayload = {
  atlas: AtlasDefinition
  fileName: string
  meshMode: AtlasMeshMode
  supportsMeshPoints: boolean
  missingMeshCount: number
  commonFields: string[]
  defaultGroupFields: string[]
}

export type UploadAtlasError = {
  error: string
}

export const loadDefaultAtlasDefinition = createAsyncThunk<
  { atlasId: string; atlas: AtlasDefinition | null },
  { atlasId: string },
  { rejectValue: AtlasDefinitionLoadError }
>(
  'atlasDefinition/loadDefaultAtlasDefinition',
  async ({ atlasId }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}data/atlas_3d_no_mesh_points.json`,
      )
      if (!response.ok) {
        return rejectWithValue({
          atlasId,
          error: `HTTP ${response.status}`,
        })
      }

      const atlasJson = (await response.json()) as AtlasDefinition
      if (atlasJson?.id && atlasJson.id !== atlasId) {
        return { atlasId, atlas: null }
      }

      return { atlasId, atlas: atlasJson }
    } catch (error) {
      return rejectWithValue({
        atlasId,
        error: error instanceof Error ? error.message : 'Failed to load atlas.',
      })
    }
  },
)

export const uploadAtlasDefinitionFromFile = createAsyncThunk<
  UploadAtlasPayload,
  { file: File; meshMode: AtlasMeshMode },
  { rejectValue: UploadAtlasError }
>(
  'atlasDefinition/uploadAtlasDefinitionFromFile',
  async ({ file, meshMode }, { rejectWithValue }) => {
    try {
      const raw = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        return rejectWithValue({ error: 'The file is not valid JSON.' })
      }

      const result = validateAtlasDefinition(parsed, 'without_mesh_points')
      if (!result.ok) {
        return rejectWithValue({ error: result.error })
      }

      const supportsMeshPoints = atlasSupports3d(result.atlas, 'with_mesh_points')
      const nextMeshMode: AtlasMeshMode = supportsMeshPoints
        ? meshMode
        : 'without_mesh_points'

      return {
        atlas: result.atlas,
        fileName: file.name,
        meshMode: nextMeshMode,
        supportsMeshPoints,
        missingMeshCount: countRoisWithoutValidMeshPoints(result.atlas),
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
