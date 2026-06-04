import type { InitialDataConfig } from '@/config/initialData'
import type { AtlasDefinition } from '@/types/atlas'
import type { MatrixOrderEntry } from '@/types/matrixOrder'
import type { RootState } from '@/types/store'

export const buildAtlasOrder = (
  matrixOrder: MatrixOrderEntry[],
  atlasDefinition: AtlasDefinition | null,
) => {
  if (matrixOrder.length === 0) return []
  if (!atlasDefinition?.rois?.length) return matrixOrder

  const roiById = new Map(
    atlasDefinition.rois.flatMap((roi) => [
      [String(roi.id), roi] as const,
      [String(roi.atlasId), roi] as const,
    ]),
  )
  return matrixOrder.map((entry) => {
    const roi = roiById.get(entry.id)
    if (!roi) return entry
    return {
      ...entry,
      name: roi.name ?? entry.name ?? entry.label,
      label: roi.name ?? entry.label,
      acronym: roi.label ?? entry.label,
      tags: roi.tags,
      metadata: roi.metadata,
    }
  })
}

export const resolveAtlasDefinition = (state: RootState, atlasId?: string) => {
  if (state.atlasDefinition.uploaded?.atlas) {
    return state.atlasDefinition.uploaded.atlas
  }
  if (!atlasId) return null
  return state.atlasDefinition.defaultById[atlasId] ?? null
}

export const buildAtlasOrderFromDefinition = (
  atlasDefinition: AtlasDefinition,
): MatrixOrderEntry[] =>
  atlasDefinition.rois.map((roi) => ({
    id: String(roi.id),
    label: roi.name ?? roi.label ?? String(roi.id),
    name: roi.name ?? roi.label ?? String(roi.id),
    acronym: roi.label ?? roi.name ?? String(roi.id),
    tags: roi.tags,
    metadata: roi.metadata,
  }))

export const getInitialDataFileName = (
  file: InitialDataConfig['initialDatasetFile'] | InitialDataConfig['testAtlasFile'],
) => file.path.split('/').pop() ?? file.label
