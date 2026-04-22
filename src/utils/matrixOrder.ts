export type MatrixOrderItem =
  | string
  | number
  | {
      id?: string
      label?: string
      name?: string
      value?: string
    }

export type MatrixOrderEntry = {
  id: string
  label: string
  acronym?: string
}

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
    return { id, label }
  })
}

export const buildLabelNameMap = (entries: MatrixOrderEntry[]) => {
  return entries.reduce<Record<string, string>>((acc, entry) => {
    acc[entry.id] = entry.label
    return acc
  }, {})
}
