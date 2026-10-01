import { AimOutlined, AppstoreOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Segmented, Select, Tooltip } from 'antd'
import { type ReactNode,useMemo } from 'react'

import {
  getMeasureOptions,
  getRankingAspectOptions,
  getRankingAspectSelectionPatch,
  getRankingQueryMissingFields,
  getSourceOptions,
  getStatisticOptions,
  linkMetricOptions,
  networkMetricOptions,
  nodeMetricOptions,
} from '@/components/rankings/rankingOptions'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'
import { patchRankingQuery, runRankingQuery, setRankingTarget } from '@/store/slices/rankings'
import type { RankingTarget } from '@/types/rankings'
import { ALL_COMPATIBLE_ASPECT_VALUES } from '@/utils/rankings/rankingNetworkMetadata'

const createRankingTargetOption = (value: RankingTarget, icon: ReactNode, label: string) => ({
  value,
  label: (
    <Tooltip title={label}>
      <span className="ranking-target-option" aria-label={label}>
        {icon}
      </span>
    </Tooltip>
  ),
})

const rankingTargetOptions = [
  createRankingTargetOption('networks', <AppstoreOutlined />, 'Network'),
  createRankingTargetOption('links', <LinkOutlined />, 'Links'),
  createRankingTargetOption('nodes', <AimOutlined />, 'Nodes'),
]

export default function RankingQueryControls() {
  const dispatch = useAppDispatch()
  const query = useAppSelector((state) => state.rankings.currentQuery)
  const status = useAppSelector((state) => state.rankings.status)
  const datasetContent = useAppSelector((state) => selectDatasetContent(state))

  const metricOptions =
    query.target === 'networks'
      ? networkMetricOptions
      : query.target === 'links'
        ? linkMetricOptions
        : nodeMetricOptions
  const sourceOptions = useMemo(
    () => getSourceOptions(datasetContent, query),
    [datasetContent, query],
  )
  const measureOptions = useMemo(
    () => getMeasureOptions(datasetContent, query),
    [datasetContent, query],
  )
  const statisticOptions = useMemo(
    () => getStatisticOptions(datasetContent, query),
    [datasetContent, query],
  )
  const aspectOptions = useMemo(
    () => getRankingAspectOptions(datasetContent, query),
    [datasetContent, query],
  )
  const labels = {
    source: datasetContent?.catalogs.core.source.label ?? 'Source',
    measure: datasetContent?.catalogs.core.measure.label ?? 'Measure',
    statistic: datasetContent?.catalogs.core.statistic.label ?? 'Statistic',
  }
  const selectedSourceValue = query.sourceIds ?? (query.sourceId ? [query.sourceId] : [])
  const selectedMeasureValue = query.measureId
  const selectedStatisticValue = query.statisticId
  const missingFields = getRankingQueryMissingFields(query, datasetContent)
  const canAddRanking = missingFields.length === 0 && status !== 'loading'

  const updateTarget = (target: RankingTarget) => {
    dispatch(setRankingTarget(target))
  }

  const updateSource = (sourceIds: string[]) => {
    dispatch(
      patchRankingQuery({
        sourceIds,
        sourceId: undefined,
        networkKind: undefined,
        aggregationGroupingKey: undefined,
        mode: sourceIds.length === 1 ? query.mode : 'networkCollection',
        networkId: undefined,
      }),
    )
  }

  const updateMeasure = (measureId?: string) => {
    dispatch(
      patchRankingQuery({
        measureId,
        networkId: undefined,
      }),
    )
  }

  const updateStatistic = (statisticId?: string) => {
    dispatch(
      patchRankingQuery({
        statisticId,
        networkId: undefined,
      }),
    )
  }

  const updateAspect = (aspectId: string, values?: string[]) => {
    const current = query.aspectFilters ?? {}
    const previous = current[aspectId] ?? []
    const switchedFromAllToSpecific =
      previous.includes(ALL_COMPATIBLE_ASPECT_VALUES) &&
      values &&
      values.length > 1 &&
      values.includes(ALL_COMPATIBLE_ASPECT_VALUES)
    let nextValues: string[]
    if (switchedFromAllToSpecific) {
      nextValues = values.filter((value) => value !== ALL_COMPATIBLE_ASPECT_VALUES)
    } else if (!values || values.includes(ALL_COMPATIBLE_ASPECT_VALUES)) {
      nextValues = values?.includes(ALL_COMPATIBLE_ASPECT_VALUES)
        ? [ALL_COMPATIBLE_ASPECT_VALUES]
        : []
    } else {
      nextValues = values
    }
    const nextAspectFilters = {
      ...current,
      [aspectId]: nextValues,
    }
    const singleNetworkMode = Boolean(datasetContent?.catalogs.aspects.every((aspect) => {
      const selected = nextAspectFilters[aspect.id] ?? []
      return selected.length === 1 && !selected.includes(ALL_COMPATIBLE_ASPECT_VALUES)
    }))

    dispatch(
      patchRankingQuery({
        aspectFilters: nextAspectFilters,
        ...getRankingAspectSelectionPatch(datasetContent, query, nextAspectFilters),
        mode: singleNetworkMode ? 'singleNetwork' : 'networkCollection',
        networkId: undefined,
      }),
    )
  }

  return (
    <Form layout="vertical" className="network-selector-controls ranking-query-controls">
      <div className="ranking-query-controls__main-row">
        <Form.Item
          label="Ranking type"
          className="network-segmented-setting ranking-query-controls__target"
        >
          <Segmented
            value={query.target}
            onChange={(value) => updateTarget(value as RankingTarget)}
            options={rankingTargetOptions}
          />
        </Form.Item>

        <Form.Item label={labels.source} className="ranking-query-controls__source">
          <Select
            mode="multiple"
            maxTagCount="responsive"
            placeholder={`Select ${labels.source.toLowerCase()}...`}
            value={selectedSourceValue}
            options={sourceOptions}
            onChange={updateSource}
          />
        </Form.Item>

        <Form.Item label={labels.measure} className="ranking-query-controls__field">
          <Select
            placeholder={`Select ${labels.measure.toLowerCase()}...`}
            value={selectedMeasureValue}
            disabled={!datasetContent}
            options={measureOptions}
            onChange={updateMeasure}
          />
        </Form.Item>

        <Form.Item label={labels.statistic} className="ranking-query-controls__field">
          <Select
            placeholder={`Select ${labels.statistic.toLowerCase()}...`}
            value={selectedStatisticValue}
            disabled={!datasetContent}
            options={statisticOptions}
            onChange={updateStatistic}
          />
        </Form.Item>

        <Form.Item label="Ranking metric" className="ranking-query-controls__field">
          <Select
            placeholder="Select a score..."
            value={query.metric}
            options={metricOptions}
            onChange={(metric) => dispatch(patchRankingQuery({ metric }))}
          />
        </Form.Item>

        {aspectOptions.map((aspect) => (
          <Form.Item key={aspect.id} label={aspect.label} className="ranking-query-controls__layers">
            <Select
              placeholder={`Select ${aspect.label.toLowerCase()}...`}
              mode="multiple"
              maxTagCount="responsive"
              value={query.aspectFilters?.[aspect.id] ?? []}
              disabled={!datasetContent}
              options={aspect.options}
              onChange={(values) => updateAspect(aspect.id, values)}
            />
          </Form.Item>
        ))}

        <Button
          className="ranking-query-controls__submit"
          type="primary"
          icon={<PlusOutlined />}
          loading={status === 'loading'}
          disabled={!canAddRanking}
          onClick={() => void dispatch(runRankingQuery())}
        >
          Add ranking
        </Button>
      </div>
    </Form>
  )
}
