import type { AtlasDefinitionState } from '@/types/atlas'
import type { AtlasDefinition } from '@/types/atlas'

export type AtlasDefinitionLoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export type AtlasDefinitionSliceState = AtlasDefinitionState & {
  defaultById: Record<string, AtlasDefinition | null>
  defaultStatusById: Record<string, AtlasDefinitionLoadStatus>
  defaultErrorById: Record<string, string | null>
  uploadStatus: AtlasDefinitionLoadStatus
  uploadError: string | null
}

export const initialAtlasDefinitionState: AtlasDefinitionSliceState = {
  uploaded: null,
  defaultById: {},
  defaultStatusById: {},
  defaultErrorById: {},
  uploadStatus: 'idle',
  uploadError: null,
}
