import type { TooltipValueLabel } from '@/components/common/tooltipValueLabel'
import { formatTooltipValue } from '@/components/common/tooltipValueLabel'
import { escapeHtml } from '@/utils/html'

export type SnapshotLabels = {
  rows: string[]
  cols: string[]
  names: Record<string, string>
  valueLabel: TooltipValueLabel
}

export function describeDatum(datum: unknown, labels: SnapshotLabels) {
  if (!datum || typeof datum !== 'object') return null
  const data = datum as Record<string, unknown>
  const row = typeof data.rowId === 'string' ? data.rowId
    : typeof data.row === 'number' ? labels.rows[data.row] : undefined
  const col = typeof data.colId === 'string' ? data.colId
    : typeof data.col === 'number' ? labels.cols[data.col] : undefined
  const name = (id: string) => escapeHtml(labels.names[id] ?? id)
  if (row !== undefined && col !== undefined && typeof data.value === 'number' && Number.isFinite(data.value)) {
    return { ids: [row, col], html: `<strong>${name(row)} ↔ ${name(col)}</strong>${formatTooltipValue(labels.valueLabel, data.value, row, col)}` }
  }
  if (typeof data.labelId === 'string') {
    return { ids: [data.labelId], html: `<strong>${name(data.labelId)}</strong>` }
  }
  return null
}
