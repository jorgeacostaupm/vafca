import { AimOutlined, AppstoreOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Segmented, Select, Tooltip } from 'antd'
import { useMemo, type ReactNode } from 'react'

import {
  getCompatibleLayerOptions,
  getMeasureOptions,
  getRankingLayerSelectionPatch,
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
import { ALL_COMPATIBLE_LAYERS } from '@/utils/rankings/rankingNetworkMetadata'

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

const splitSourceValue = (value?: string) => {
  if (!value) {
    return { sourceType: undefined, sourceId: undefined }
  }
  const [sourceType, ...rest] = value.split('::')
  return {
    sourceType: sourceType as 'population' | 'subject' | 'comparison',
    sourceId: rest.join('::'),
  }
}

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
  const layerOptions = useMemo(
    () => getCompatibleLayerOptions(datasetContent, query),
    [datasetContent, query],
  )
  const isNodeRanking = query.target === 'nodes'
  const selectableLayerOptions = useMemo(
    () =>
      isNodeRanking
        ? layerOptions.filter((option) => option.value !== ALL_COMPATIBLE_LAYERS)
        : layerOptions,
    [layerOptions, isNodeRanking],
  )
  const selectedSourceValue =
    query.sourceType && query.sourceId ? `${query.sourceType}::${query.sourceId}` : undefined
  const selectedMeasureValue = query.measureId
  const selectedStatisticValue = query.statisticId
  const selectedLayerValues = query.layerIds ?? []
  const selectedSingleLayerValue = query.layerIds?.[0]
  const missingFields = getRankingQueryMissingFields(query, datasetContent)
  const canAddRanking = missingFields.length === 0 && status !== 'loading'

  const updateTarget = (target: RankingTarget) => {
    dispatch(setRankingTarget(target))
  }

  const updateSource = (value?: string) => {
    const source = splitSourceValue(value)
    dispatch(
      patchRankingQuery({
        ...source,
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

  const updateLayers = (layerIds?: string[]) => {
    const switchedFromAllToSpecific =
      selectedLayerValues.includes(ALL_COMPATIBLE_LAYERS) &&
      layerIds &&
      layerIds.length > 1 &&
      layerIds.includes(ALL_COMPATIBLE_LAYERS)
    let nextLayerIds: string[]
    if (switchedFromAllToSpecific) {
      nextLayerIds = layerIds.filter((layerId) => layerId !== ALL_COMPATIBLE_LAYERS)
    } else if (!layerIds || layerIds.includes(ALL_COMPATIBLE_LAYERS)) {
      nextLayerIds = layerIds?.includes(ALL_COMPATIBLE_LAYERS) ? [ALL_COMPATIBLE_LAYERS] : []
    } else {
      nextLayerIds = layerIds
    }

    dispatch(
      patchRankingQuery({
        layerIds: nextLayerIds,
        ...getRankingLayerSelectionPatch(datasetContent, query, nextLayerIds),
        mode: nextLayerIds?.length === 1 ? 'singleNetwork' : 'networkCollection',
        networkId: undefined,
      }),
    )
  }

  const updateSingleLayer = (layerId?: string) => {
    dispatch(
      patchRankingQuery({
        layerIds: layerId ? [layerId] : [],
        ...getRankingLayerSelectionPatch(datasetContent, query, layerId ? [layerId] : []),
        mode: 'singleNetwork',
        networkId: undefined,
      }),
    )
  }

  return (
    <Form layout="vertical" className="network-selector-controls">
      <div className="ranking-query-controls__main-row ">
        <Form.Item label="Ranking type" className="network-segmented-setting">
          <Segmented
            value={query.target}
            onChange={(value) => updateTarget(value as RankingTarget)}
            options={rankingTargetOptions}
          />
        </Form.Item>

        <Form.Item label="Source">
          <Select
            placeholder="Select a source..."
            value={selectedSourceValue}
            options={sourceOptions}
            onChange={updateSource}
          />
        </Form.Item>

        <Form.Item label="Measure">
          <Select
            placeholder="Select a measure..."
            value={selectedMeasureValue}
            disabled={!datasetContent}
            options={measureOptions}
            onChange={updateMeasure}
          />
        </Form.Item>

        <Form.Item label="Statistic">
          <Select
            placeholder="Select a statistic..."
            value={selectedStatisticValue}
            disabled={!datasetContent}
            options={statisticOptions}
            onChange={updateStatistic}
          />
        </Form.Item>

        <Form.Item label="Ranking metric">
          <Select
            placeholder="Select a score..."
            value={query.metric}
            options={metricOptions}
            onChange={(metric) => dispatch(patchRankingQuery({ metric }))}
          />
        </Form.Item>

        <Form.Item label="Layers" className="ranking-query-controls__layers">
          {isNodeRanking ? (
            <Select
              placeholder="Select one layer..."
              value={selectedSingleLayerValue}
              disabled={!datasetContent}
              options={selectableLayerOptions}
              onChange={updateSingleLayer}
            />
          ) : (
            <Select
              placeholder="Select layers..."
              mode="multiple"
              value={selectedLayerValues}
              disabled={!datasetContent}
              options={selectableLayerOptions}
              onChange={updateLayers}
            />
          )}
        </Form.Item>

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
