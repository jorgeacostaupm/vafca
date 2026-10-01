import { createAsyncThunk } from '@reduxjs/toolkit'
import { strFromU8,unzipSync } from 'fflate'

import type { AtlasDefinition } from '@/types/atlas'
import { validateAtlasDefinition } from '@/utils/atlas/atlasDefinition'

export type UploadAtlasPayload = {
  atlas: AtlasDefinition
  fileName: string
  commonFields: string[]
  compatibilityWarning?: string
}

export type UploadAtlasError = {
  error: string
}

export const uploadAtlasDefinitionFromFile = createAsyncThunk<
  UploadAtlasPayload,
  { file: File },
  { rejectValue: UploadAtlasError }
>(
  'atlasDefinition/uploadAtlasDefinitionFromFile',
  async ({ file }, { rejectWithValue }) => {
    try {
      const entries = file.name.toLowerCase().endsWith('.zip')
        ? unzipSync(new Uint8Array(await file.arrayBuffer())) : null
      if (entries && !entries['atlas.json']) throw new Error('Atlas ZIP must contain atlas.json.')
      const raw = entries ? strFromU8(entries['atlas.json']) : await file.text()
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
