import { CheckOutlined } from '@ant-design/icons'
import { Button, InputNumber, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { useCatalogItemUpdater } from '@/components/management/components/catalogs/useCatalogItemUpdater'
import { isEnabled, normalizeNumber } from '@/components/management/utils/catalogValues'
import type { Statistic } from '@/types/network'

import CatalogItemEditor from './CatalogItemEditor'

type StatDraft = {
  id: string
  label: string
  description: string
  enabled: boolean
  min?: number
  max?: number
}

type EditableStat = Statistic & {
  description?: string | null
  enabled?: boolean
}

type StatCatalogSectionProps = {
  stats: EditableStat[]
  emptyMessage: string
}

const toDraft = (stat: EditableStat): StatDraft => ({
  id: stat.id,
  label: stat.label ?? '',
  description: stat.description ?? '',
  enabled: isEnabled(stat),
  min: stat.expectedRange?.[0] ?? stat.min ?? undefined,
  max: stat.expectedRange?.[1] ?? stat.max ?? undefined,
})

const toDrafts = (stats: EditableStat[]) =>
  Object.fromEntries(stats.map((stat) => [stat.id, toDraft(stat)]))

const draftsAreEqual = (draft: StatDraft | undefined, stat: EditableStat) => {
  if (!draft) return false
  const baseline = toDraft(stat)
  return (
    draft.label === baseline.label &&
    draft.description === baseline.description &&
    draft.enabled === baseline.enabled &&
    draft.min === baseline.min &&
    draft.max === baseline.max
  )
}

const hasInvalidRange = (draft: StatDraft) =>
  draft.min !== undefined && draft.max !== undefined && draft.min > draft.max

function StatCatalogSection({ stats, emptyMessage }: StatCatalogSectionProps) {
  const updateItem = useCatalogItemUpdater()
  const [drafts, setDrafts] = useState<Record<string, StatDraft>>(() => toDrafts(stats))

  useEffect(() => {
    setDrafts(toDrafts(stats))
  }, [stats])

  const dirtyStats = useMemo(
    () => stats.filter((stat) => !draftsAreEqual(drafts[stat.id], stat)),
    [drafts, stats],
  )
  const invalidRange = Object.values(drafts).some(hasInvalidRange)
  const canSave = dirtyStats.length > 0 && !invalidRange

  const updateDraft = (id: string, changes: Partial<StatDraft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...changes,
      },
    }))
  }

  const handleSave = () => {
    dirtyStats.forEach((stat) => {
      const draft = drafts[stat.id]
      if (!draft) return
      updateItem('statistics', stat.id, {
        label: draft.label,
        description: draft.description,
        enabled: draft.enabled,
        min: draft.min,
        max: draft.max,
      })
    })
  }

  return (
    <div className="catalog-management-section">
      <div className="catalog-management-grid">
        {stats.length === 0 ? (
          <Typography.Text type="secondary">{emptyMessage}</Typography.Text>
        ) : null}
        {stats.map((stat) => {
          const draft = drafts[stat.id] ?? toDraft(stat)

          return (
            <CatalogItemEditor key={stat.id} item={draft} label="Statistic label"
              onChange={changes => updateDraft(stat.id, changes)} >
              <InputNumber size="small" placeholder="Min" aria-label="Statistic minimum"
                value={draft.min ?? null} onChange={value => updateDraft(stat.id, { min: normalizeNumber(value) })} />
              <InputNumber size="small" placeholder="Max" aria-label="Statistic maximum"
                value={draft.max ?? null} onChange={value => updateDraft(stat.id, { max: normalizeNumber(value) })} />
            </CatalogItemEditor>
          )
        })}
      </div>
      <div className="catalog-management-actions">
        {invalidRange ? (
          <Typography.Text type="danger">Min must be less than or equal to max.</Typography.Text>
        ) : null}
        <Button
          size="small"
          type="primary"
          icon={<CheckOutlined />}
          disabled={!canSave}
          onClick={handleSave}
        >
          Apply
        </Button>
      </div>
    </div>
  )
}

export default StatCatalogSection
