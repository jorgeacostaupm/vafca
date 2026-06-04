import type { Catalogs } from '@/types/connectivityBundle'
import type { UpdateCatalogPayload } from '@/types/datasetState'

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const normalizeMeasureChanges = (
  existing: Record<string, unknown>,
  changes: Record<string, unknown>,
) => {
  const min = changes.min
  const max = changes.max
  const nextChanges: Record<string, unknown> = {
    ...changes,
    expectedRange: isFiniteNumber(min) && isFiniteNumber(max) ? [min, max] : null,
  }

  const valueDomain = existing.valueDomain
  if (typeof valueDomain === 'object' && valueDomain !== null) {
    nextChanges.valueDomain = {
      ...valueDomain,
      min: isFiniteNumber(min) ? min : null,
      max: isFiniteNumber(max) ? max : null,
    }
  }

  delete nextChanges.min
  delete nextChanges.max
  return nextChanges
}

const normalizeRangeChanges = (changes: Record<string, unknown>) => {
  if (!('min' in changes) && !('max' in changes)) return changes

  const min = changes.min
  const max = changes.max
  const nextChanges: Record<string, unknown> = {
    ...changes,
    expectedRange: isFiniteNumber(min) && isFiniteNumber(max) ? [min, max] : null,
  }

  delete nextChanges.min
  delete nextChanges.max
  return nextChanges
}

const normalizeCatalogChanges = (
  catalog: UpdateCatalogPayload['catalog'],
  existing: Record<string, unknown>,
  changes: Record<string, unknown>,
) => {
  if (catalog === 'measures') {
    return normalizeMeasureChanges(existing, changes)
  }

  if (catalog === 'stats') {
    return normalizeRangeChanges(changes)
  }

  return changes
}

export const updateDatasetCatalogItem = (
  catalogs: Catalogs,
  payload: UpdateCatalogPayload,
) => {
  const catalogMap = catalogs[payload.catalog] as Record<
    string,
    Record<string, unknown>
  >
  const existing = catalogMap[payload.id]
  if (!existing) return

  catalogMap[payload.id] = {
    ...existing,
    ...normalizeCatalogChanges(payload.catalog, existing, payload.changes),
  }
}
