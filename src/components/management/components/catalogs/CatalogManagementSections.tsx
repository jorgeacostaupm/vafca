import { Typography } from 'antd'
import { useMemo } from 'react'

import AspectCatalogSection from '@/components/management/components/catalogs/AspectCatalogSection'
import MeasureCatalogSection from '@/components/management/components/catalogs/MeasureCatalogSection'
import SourceCatalogSection from '@/components/management/components/catalogs/SourceCatalogSection'
import {
  buildStatUsageById,
  classifyStatCatalogItemWithUsage,
} from '@/components/management/components/catalogs/statCatalogGroups'
import StatCatalogSection from '@/components/management/components/catalogs/StatCatalogSection'
import { useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'

function CatalogManagementSections() {
  const stats = useAppSelector((state) => selectDatasetContent(state)?.catalogs.statistics ?? {})
  const networks = useAppSelector((state) => selectDatasetContent(state)?.networks ?? [])
  const sources = useAppSelector((state) => selectDatasetContent(state)?.catalogs.sources ?? {})
  const statUsageById = useMemo(() => buildStatUsageById(networks, sources), [networks, sources])
  const { networkStats, comparisonStats } = useMemo(
    () =>
      Object.values(stats).reduce(
        (groups, stat) => {
          const group = classifyStatCatalogItemWithUsage(stat, statUsageById[stat.id])
          if (group === 'comparison') {
            groups.comparisonStats.push(stat)
          } else {
            groups.networkStats.push(stat)
          }
          return groups
        },
        {
          networkStats: [] as (typeof stats)[keyof typeof stats][],
          comparisonStats: [] as (typeof stats)[keyof typeof stats][],
        },
      ),
    [statUsageById, stats],
  )

  const items = [
    {
      key: 'sources',
      label: 'Sources',
      children: <SourceCatalogSection />,
    },
    {
      key: 'measures',
      label: 'Measures',
      children: <MeasureCatalogSection />,
    },
    {
      key: 'matrix-stats',
      label: 'Matrix statistics',
      children: (
        <StatCatalogSection stats={networkStats} emptyMessage="No matrix statistics available." />
      ),
    },
    {
      key: 'comparison-stats',
      label: 'Comparison statistics',
      children: (
        <StatCatalogSection
          stats={comparisonStats}
          emptyMessage="No comparison statistics available."
        />
      ),
    },
    {
      key: 'aspects',
      label: '',
      children: <AspectCatalogSection />,
    },
  ]

  return (
    <div className="catalog-management-categories">
      {items.map((item) => (
        <section
          key={item.key}
          className="catalog-management-category"
          aria-labelledby={`catalog-${item.key}`}
        >
          <Typography.Title level={5} id={`catalog-${item.key}`}>
            {item.label}
          </Typography.Title>
          {item.children}
        </section>
      ))}
    </div>
  )
}

export default CatalogManagementSections
