import { InfoCircleOutlined } from '@ant-design/icons'
import { Button, Descriptions, Popover } from 'antd'

import { formatRankingPanelTitle, getRankingMetricLabel } from '@/components/rankings/rankingOptions'
import { useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'
import type { NetworkFilterExpression } from '@/types/edgeFilter'
import type { NetworkDataset } from '@/types/network'
import type { RankingResult } from '@/types/rankings'
import { isAtlasLabelEnabled } from '@/utils/atlas/labels'
import { ALL_COMPATIBLE_ASPECT_VALUES, getNetworkLabel } from '@/utils/rankings/rankingNetworkMetadata'
import { getRankingDimensions } from '@/utils/rankings/rankingPresentation'

const describeFilter = (expression: NetworkFilterExpression, dataset: NetworkDataset): string => {
  if (expression.type === 'group') return `(${expression.children.map((child, index) =>
    `${index ? `${child.joinOperator ?? expression.operator} ` : ''}${describeFilter(child, dataset)}`).join(' ')})`
  const network = dataset.networkIndex[expression.networkId]
  const label = network ? getNetworkLabel(network, dataset) : expression.networkId
  const range = `${expression.includeMin ? '[' : '('}${expression.min ?? '−∞'}, ${expression.max ?? '∞'}${expression.includeMax ? ']' : ')'}`
  const operators = {
    between: `in ${range}`, outside: `outside [${expression.min}, ${expression.max}]`,
    lt: `< ${expression.max}`, lte: `≤ ${expression.max}`,
    gt: `> ${expression.min}`, gte: `≥ ${expression.min}`,
    abs_gte: `absolute value ≥ ${expression.min}`, abs_between: `absolute value in ${range}`,
    negative_and_positive_ranges: `in ${expression.includeMin ? '[' : '('}${expression.negativeMin}, ${expression.negativeMax}${expression.includeMax ? ']' : ')'} or ${expression.includeMin ? '[' : '('}${expression.positiveMin}, ${expression.positiveMax}${expression.includeMax ? ']' : ')'}`,
  }
  return `${label}: ${operators[expression.operator]}`
}

export default function RankingDetails({ result }: { result: RankingResult }) {
  const dataset = useAppSelector(selectDatasetContent)
  const atlas = useAppSelector(state => state.atlasUi)
  const filters = useAppSelector(state => state.networkFilters)
  if (!dataset) return null
  const { query } = result
  const activeNodes = atlas.order.filter(id => isAtlasLabelEnabled(atlas.labelsById[id]))
  const items = [
    { key: 'measure', label: dataset.catalogs.core.measure.label, children: dataset.catalogs.measures[query.measureId ?? '']?.label ?? query.measureId ?? 'All' },
    { key: 'statistic', label: dataset.catalogs.core.statistic.label, children: dataset.catalogs.statistics[query.statisticId ?? '']?.label ?? query.statisticId ?? 'All' },
    { key: 'metric', label: 'Ranking metric', children: getRankingMetricLabel(query) },
    ...getRankingDimensions(query, dataset).map(dimension => ({ key: `dimension-${dimension.id}`, label: dimension.label, children: `${query.aspectFilters?.[dimension.id]?.includes(ALL_COMPATIBLE_ASPECT_VALUES) ? 'All compatible: ' : ''}${dimension.values.map(dimension.labelFor).join(', ') || 'None'}` })),
    { key: 'limit', label: 'Results', children: `${result.rows.length} shown / ${result.totalEligibleItems} eligible · Top ${query.topN}` },
    { key: 'autoconnections', label: 'Autoconnections', children: (query.target === 'networks' || (query.target === 'links' ? query.allowLinkRankingAutoconnections : query.allowNodeRankingAutoconnections)) ? 'Included' : 'Excluded' },
    { key: 'nodes', label: 'Nodes', children: `${activeNodes.length}/${atlas.order.length}` },
    { key: 'filter', label: 'Edge filter', children: filters.activeNetworkFilter && filters.activeEdgeMask ? describeFilter(filters.activeNetworkFilter.root, dataset) : 'None' },
    { key: 'live', label: 'Updates', children: 'Recomputed when active atlas nodes or the edge filter change.' },
    ...(query.threshold !== undefined ? [{ key: 'threshold', label: 'Threshold', children: String(query.threshold) }] : []),
    { key: 'created', label: 'Created', children: new Date(result.createdAt).toLocaleString() },
    ...(result.warnings?.length ? [{ key: 'warnings', label: 'Warnings', children: result.warnings.join('; ') }] : []),
  ]
  return (
    <Popover trigger="click" title={formatRankingPanelTitle(result, dataset)} content={
      <div className="ranking-details"><Descriptions size="small" column={1} items={items} /></div>
    }>
      <Button size="small" type="text" icon={<InfoCircleOutlined />} aria-label="Ranking details" title="Ranking details" />
    </Popover>
  )
}
