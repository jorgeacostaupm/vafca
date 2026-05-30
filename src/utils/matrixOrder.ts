import type { MatrixOrderEntry, MatrixOrderItem } from "@/types/matrixOrder"


const toSafeString = (value: unknown, fallback: string) => {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

export const normalizeMatrixOrder = (
  matrixOrder: MatrixOrderItem[] | undefined | null
): MatrixOrderEntry[] => {
  if (!matrixOrder || matrixOrder.length === 0) return []
  return matrixOrder.map((item, index) => {
    if (typeof item === 'string') {
      return { id: item, label: item }
    }
    if (typeof item === 'number') {
      const asString = Number.isFinite(item) ? String(item) : String(index)
      return { id: asString, label: asString }
    }
    const id = toSafeString(
      item.id ?? item.value ?? item.name ?? item.label,
      String(index)
    )
    const label = toSafeString(item.label ?? item.name ?? item.id, id)
    const name =
      typeof item.name === 'string' && item.name.trim().length > 0
        ? item.name
        : undefined
    const acronym =
      typeof item.acronym === 'string' && item.acronym.trim().length > 0
        ? item.acronym
        : undefined
    const tags =
      item.tags && typeof item.tags === 'object' && !Array.isArray(item.tags)
        ? item.tags
        : undefined
    const metadata =
      item.metadata &&
      typeof item.metadata === 'object' &&
      !Array.isArray(item.metadata)
        ? item.metadata
        : undefined
    return { id, label, name, acronym, tags, metadata }
  })
}

export const buildLabelNameMap = (entries: MatrixOrderEntry[]) => {
  return entries.reduce<Record<string, string>>((acc, entry) => {
    acc[entry.id] = entry.label
    return acc
  }, {})
}
