import { Typography } from 'antd'

import SettingsSection from '@/components/common/SettingsSection'
import { useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'

export default function DataSummarySection() {
  const catalogs = useAppSelector((state) => selectDatasetContent(state)?.catalogs)
  const sources = Object.values(catalogs?.sources ?? {})
  const rows = catalogs ? [
    { id: 'populations', label: 'Populations', items: sources.filter(source => source.kind === 'population') },
    ...(['subject', 'comparison'] as const).flatMap(kind => {
      const items = sources.filter(source => source.kind === kind)
      return items.length ? [{ id: kind, label: kind === 'subject' ? 'Subjects' : 'Comparisons', items }] : []
    }),
    { id: 'measures', label: 'Measures', items: Object.values(catalogs.measures) },
    { id: 'statistics', label: 'Statistics', items: Object.values(catalogs.statistics) },
    ...catalogs.aspects.map(aspect => ({
      id: `aspect:${aspect.id}`,
      label: aspect.label,
      items: Object.values(catalogs.aspectCatalogs[aspect.id] ?? {}),
    })),
  ] : []

  return (
    <SettingsSection title="Data summary">
      {catalogs ? (
        <dl className="data-management-summary">
          {rows.map(row => (
            <div key={row.id}>
              <dt>{row.label}:</dt>{' '}
              <dd>{row.items.map(item => item.label).join(', ') || 'None'}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <Typography.Text type="secondary">No dataset loaded yet.</Typography.Text>
      )}
    </SettingsSection>
  )
}
