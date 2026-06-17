import { EyeOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Space, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { type ReactNode, useCallback, useMemo, useState } from 'react'

import ResizableContainer from '@/components/layout/ResizableContainer'
import { getRankingMetricLabel } from '@/components/rankings/rankingOptions'
import { useRankingRowInteractions } from '@/components/rankings/useRankingRowInteractions'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'
import { addNetworkViewAndFormat } from '@/store/slices/networkVisualization'
import { addSelectedLink, removeSelectedLink } from '@/store/slices/visualizationUi'
import type { LinkRankingRow, NetworkRankingRow, RankingResult, RankingRow } from '@/types/rankings'
import { toDatasetNetworkSummary } from '@/utils/datasetAccessors'
import { buildNetworkSummaryLabel } from '@/utils/matrixViewUtils'
import { getNetworkCompoundId } from '@/utils/rankings/rankingNetworkMetadata'

type Props = {
  result: RankingResult
}

type RankingTableColumn = ColumnsType<RankingRow>[number] & {
  key: string
  title?: ReactNode
  width?: number
  fixedInteraction?: boolean
}

const formatScore = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(4) : ''

const compareText = (a?: string, b?: string) =>
  (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' })

const compareNumber = (a?: number, b?: number) => (a ?? Number.NaN) - (b ?? Number.NaN)
const TABLE_CHROME_HEIGHT = 104

const getLayerValueClassName = (
  valuesByLayer: Record<string, number> | undefined,
  layerId: string,
) => {
  const entries = Object.entries(valuesByLayer ?? {}).filter(([, value]) => Number.isFinite(value))
  if (entries.length < 2) return undefined
  const values = entries.map(([, value]) => value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const value = valuesByLayer?.[layerId]
  if (value === max) return 'ranking-layer-cell ranking-layer-cell--max'
  if (value === min) return 'ranking-layer-cell ranking-layer-cell--min'
  return 'ranking-layer-cell'
}

const getLinkIds = (row: LinkRankingRow) => ({
  direct: `${row.sourceId}::${row.targetId}`,
  reverse: `${row.targetId}::${row.sourceId}`,
})

const formatLinkLabel = (row: LinkRankingRow) => `${row.sourceLabel} ↔ ${row.targetLabel}`

export default function RankingResultsTable({ result }: Props) {
  const dispatch = useAppDispatch()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 25 })
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null)
  const datasetContent = useAppSelector((state) => selectDatasetContent(state))
  const selectedLinks = useAppSelector((state) => state.visualizationUi.selectedLinks)
  const { handleEnter, handleLeave, handleSelect } = useRankingRowInteractions()
  const scoreColumnTitle = getRankingMetricLabel(result.query)

  const selectedLinkIds = useMemo(
    () => new Set(selectedLinks.map((link) => link.id)),
    [selectedLinks],
  )

  const networkLinksCountLabel = useMemo(() => {
    if (result.query.target !== 'networks') return undefined
    const counts = result.rows.flatMap((row) => (row.type === 'network' ? [row.nLinksUsed] : []))
    if (counts.length === 0) return undefined
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    return min === max ? `# links ${min}` : `# links ${min}-${max}`
  }, [result.query.target, result.rows])

  const nodeIncidentLinksCountLabel = useMemo(() => {
    if (result.query.target !== 'nodes') return undefined
    const counts = result.rows.flatMap((row) =>
      row.type === 'node' ? [row.nIncidentLinks] : [],
    )
    if (counts.length === 0) return undefined
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    return min === max ? `# incident links ${min}` : `# incident links ${min}-${max}`
  }, [result.query.target, result.rows])

  const paginationTotalLabel =
    networkLinksCountLabel ?? nodeIncidentLinksCountLabel

  const createSelectedLink = useCallback((row: LinkRankingRow) => {
    const { direct } = getLinkIds(row)
    const sourceNetwork = datasetContent?.networkIndex[row.bestNetworkId ?? result.query.networkId ?? '']
    return {
      id: direct,
      rowId: row.sourceId,
      colId: row.targetId,
      rowLabel: row.sourceLabel,
      colLabel: row.targetLabel,
      sources: [
        {
          compoundId: sourceNetwork ? getNetworkCompoundId(sourceNetwork) : '',
          networkLabel: row.bestLayerId ?? 'Ranking',
          value: row.score,
        },
      ],
    }
  }, [datasetContent, result.query.networkId])

  const addLink = useCallback((row: LinkRankingRow) => {
    const { direct, reverse } = getLinkIds(row)
    if (selectedLinkIds.has(direct) || selectedLinkIds.has(reverse)) {
      dispatch(removeSelectedLink(selectedLinkIds.has(direct) ? direct : reverse))
      return
    }
    dispatch(addSelectedLink(createSelectedLink(row)))
  }, [createSelectedLink, dispatch, selectedLinkIds])

  const addRankingLinks = useCallback(() => {
    result.rows
      .filter((row): row is LinkRankingRow => row.type === 'link')
      .forEach((row) => {
        const { direct, reverse } = getLinkIds(row)
        if (selectedLinkIds.has(direct) || selectedLinkIds.has(reverse)) return
        dispatch(addSelectedLink(createSelectedLink(row)))
      })
  }, [createSelectedLink, dispatch, result.rows, selectedLinkIds])

  const removeRankingLinks = useCallback(() => {
    result.rows
      .filter((row): row is LinkRankingRow => row.type === 'link')
      .forEach((row) => {
        const { direct, reverse } = getLinkIds(row)
        if (selectedLinkIds.has(direct)) dispatch(removeSelectedLink(direct))
        if (selectedLinkIds.has(reverse)) dispatch(removeSelectedLink(reverse))
      })
  }, [dispatch, result.rows, selectedLinkIds])

  const linkActionsTitle = useMemo(() => (
    <Space size={4}>
      <Tooltip title="Add all">
        <Button
          size="small"
          icon={<PlusOutlined />}
          aria-label="Add all ranking links"
          onClick={(event) => {
            event.stopPropagation()
            addRankingLinks()
          }}
        />
      </Tooltip>
      <Tooltip title="Remove all">
        <Button
          size="small"
          icon={<MinusOutlined />}
          aria-label="Remove all ranking links"
          onClick={(event) => {
            event.stopPropagation()
            removeRankingLinks()
          }}
        />
      </Tooltip>
    </Space>
  ), [addRankingLinks, removeRankingLinks])

  const openNetworkView = useCallback((row: NetworkRankingRow) => {
    const network = datasetContent?.networkIndex[row.networkId]
    if (!network) return
    const summary = toDatasetNetworkSummary(network)
    void dispatch(
      addNetworkViewAndFormat({
        type: 'matrix',
        compoundId: summary.compoundId,
        label: buildNetworkSummaryLabel(summary, datasetContent.catalogs),
        measureId: summary.measureId,
        statId: summary.statId,
      }),
    )
  }, [datasetContent, dispatch])

  const moveColumn = (sourceKey: string, targetKey: string, keys: string[]) => {
    if (sourceKey === targetKey) return
    setColumnOrder((current) => {
      const orderedKeys = current.filter((key) => keys.includes(key))
      const baseOrder = [...orderedKeys, ...keys.filter((key) => !orderedKeys.includes(key))]
      const sourceIndex = baseOrder.indexOf(sourceKey)
      const targetIndex = baseOrder.indexOf(targetKey)
      if (sourceIndex < 0 || targetIndex < 0) return current
      const nextOrder = [...baseOrder]
      const [moved] = nextOrder.splice(sourceIndex, 1)
      nextOrder.splice(targetIndex, 0, moved)
      return nextOrder
    })
  }

  const baseColumns = useMemo<RankingTableColumn[]>(() => {
    const common: RankingTableColumn[] = [
      {
        key: 'rank',
        title: '#',
        dataIndex: 'rank',
        sorter: (a, b) => a.rank - b.rank,
      },
    ]

    if (result.query.target === 'networks') {
      return [
        ...common,
        {
          key: 'layer',
          title: 'Layer',
          dataIndex: 'layerId',
          sorter: (a, b) =>
            compareText(
              a.type === 'network' ? a.layerId : undefined,
              b.type === 'network' ? b.layerId : undefined,
            ),
        },
        {
          key: 'score',
          title: scoreColumnTitle,
          dataIndex: 'score',
          render: formatScore,
          sorter: (a, b) => compareNumber(a.score, b.score),
        },
        {
          key: 'actions',
          title: '',
          width: 40,
          fixedInteraction: true,
          render: (_: unknown, row: RankingRow) =>
            row.type === 'network' ? (
              <Button
                size="small"
                icon={<EyeOutlined />}
                aria-label="Open as Network View"
                onClick={(event) => {
                  event.stopPropagation()
                  openNetworkView(row)
                }}
              />
            ) : null,
        },
      ]
    }

    if (result.query.target === 'links') {
      const isAggregatedLinkRanking = result.query.linkCollectionMode !== 'expanded'
      const isOneRowPerLayer = result.query.linkCollectionMode === 'expanded'
      const networkIds = Array.from(
        new Set(
          result.rows.flatMap((row) =>
            row.type === 'link' ? Object.keys(row.valuesByLayer ?? {}) : [],
          ),
        ),
      ).sort()
      const hasBestLayer = result.rows.some((row) => row.type === 'link' && Boolean(row.bestLayerId))
      const hasMultipleNetworks = result.rows.some(
        (row) =>
          row.type === 'link' && typeof row.nNetworksUsed === 'number' && row.nNetworksUsed > 1,
      )
      return [
        ...common,
        {
          key: 'link',
          title: 'Link',
          ellipsis: true,
          sorter: (a, b) =>
            compareText(
              a.type === 'link' ? formatLinkLabel(a) : undefined,
              b.type === 'link' ? formatLinkLabel(b) : undefined,
            ),
          render: (_: unknown, row: RankingRow) =>
            row.type === 'link' ? formatLinkLabel(row) : '',
        },
        ...(!isOneRowPerLayer
          ? [
              {
                key: 'score',
                title: scoreColumnTitle,
                dataIndex: 'score',
                render: formatScore,
                sorter: (a: RankingRow, b: RankingRow) => compareNumber(a.score, b.score),
              },
            ]
          : []),
        ...(isAggregatedLinkRanking
          ? networkIds.map((layerId) => ({
              key: `layer-${layerId}`,
              title: datasetContent?.catalogs.layers[layerId]?.label ?? layerId,
              sorter: (a: RankingRow, b: RankingRow) =>
                compareNumber(
                  a.type === 'link' ? a.valuesByLayer?.[layerId] : undefined,
                  b.type === 'link' ? b.valuesByLayer?.[layerId] : undefined,
                ),
              render: (_: unknown, row: RankingRow) => {
                if (row.type !== 'link') return ''
                const value = row.valuesByLayer?.[layerId]
                return (
                  <span className={getLayerValueClassName(row.valuesByLayer, layerId)}>
                    {formatScore(value)}
                  </span>
                )
              },
            }))
          : []),
        ...(!isAggregatedLinkRanking && hasBestLayer
          ? [
              {
                key: 'layer',
                title: 'Layer',
                dataIndex: 'bestLayerId',
                sorter: (a: RankingRow, b: RankingRow) =>
                  compareText(
                    a.type === 'link' ? a.bestLayerId : undefined,
                    b.type === 'link' ? b.bestLayerId : undefined,
                  ),
              },
            ]
          : []),
        ...(!isAggregatedLinkRanking && hasMultipleNetworks
          ? [
              {
                key: 'nNetworksUsed',
                title: 'N networks',
                dataIndex: 'nNetworksUsed',
                sorter: (a: RankingRow, b: RankingRow) =>
                  compareNumber(
                    a.type === 'link' ? a.nNetworksUsed : undefined,
                    b.type === 'link' ? b.nNetworksUsed : undefined,
                  ),
              },
            ]
          : []),
        {
          key: 'actions',
          title: linkActionsTitle,
          render: (_: unknown, row: RankingRow) => {
            if (row.type !== 'link') return null
            const { direct, reverse } = getLinkIds(row)
            const exists = selectedLinkIds.has(direct) || selectedLinkIds.has(reverse)
            return (
              <Button
                size="small"
                icon={exists ? <MinusOutlined /> : <PlusOutlined />}
                aria-label={exists ? 'Remove link' : 'Add link'}
                onClick={(event) => {
                  event.stopPropagation()
                  addLink(row)
                }}
              />
            )
          },
        },
      ]
    }

    return [
      ...common,
      {
        key: 'node',
        title: 'Node',
        dataIndex: 'label',
        ellipsis: true,
        sorter: (a, b) =>
          compareText(
            a.type === 'node' ? a.label : undefined,
            b.type === 'node' ? b.label : undefined,
          ),
      },
      {
        key: 'score',
        title: scoreColumnTitle,
        dataIndex: 'score',
        render: formatScore,
        sorter: (a, b) => compareNumber(a.score, b.score),
      },
      {
        key: 'nIncidentLinks',
        title: 'Incident links',
        dataIndex: 'nIncidentLinks',
        sorter: (a, b) =>
          compareNumber(
            a.type === 'node' ? a.nIncidentLinks : undefined,
            b.type === 'node' ? b.nIncidentLinks : undefined,
          ),
      },
    ]
  }, [
    addLink,
    datasetContent,
    linkActionsTitle,
    openNetworkView,
    result.query,
    result.rows,
    scoreColumnTitle,
    selectedLinkIds,
  ])

  const columns = useMemo<ColumnsType<RankingRow>>(() => {
    const keys = baseColumns.map((column) => column.key)
    const orderedKeys = [
      ...columnOrder.filter((key) => keys.includes(key)),
      ...keys.filter((key) => !columnOrder.includes(key)),
    ]
    const columnByKey = new Map(baseColumns.map((column) => [column.key, column]))

    return orderedKeys.flatMap((key) => {
      const column = columnByKey.get(key)
      if (!column) return []
      const fixedInteraction = column.fixedInteraction === true

      return [
        {
          ...column,
          align: column.align ?? 'center',
          title: (
            <span
              className={[
                'ranking-column-header',
                draggedColumnKey === key ? 'ranking-column-header--dragging' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onDragOver={(event) => {
                if (!fixedInteraction) event.preventDefault()
              }}
              onDrop={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (draggedColumnKey && !fixedInteraction) {
                  moveColumn(draggedColumnKey, key, keys)
                }
                setDraggedColumnKey(null)
              }}
            >
              <span
                className="ranking-column-header__label"
                draggable={!fixedInteraction}
                onDragStart={(event) => {
                  event.stopPropagation()
                  if (fixedInteraction) {
                    event.preventDefault()
                    return
                  }
                  setDraggedColumnKey(key)
                }}
                onDragEnd={() => setDraggedColumnKey(null)}
              >
                {column.title}
              </span>
            </span>
          ),
        },
      ]
    })
  }, [baseColumns, columnOrder, draggedColumnKey])

  const tableScrollX = useMemo(
    () =>
      columns.reduce((total, column) => {
        return total + (typeof column.width === 'number' ? column.width : 0)
      }, 0),
    [columns],
  )

  return (
    <div className="ranking-result">
      <ResizableContainer>
        {({ height }) => (
          <Table<RankingRow>
            size="small"
            rowKey={(row) =>
              row.type === 'network'
                ? row.networkId
                : row.type === 'node'
                  ? row.nodeId
                  : `${row.sourceId}::${row.targetId}::${row.bestNetworkId ?? 'all'}`
            }
            columns={columns}
            className={[
              'ranking-result__table',
              result.query.target === 'links' ? 'ranking-result__table--links' : '',
              result.query.target === 'nodes' ? 'ranking-result__table--nodes' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            dataSource={result.rows}
            tableLayout="auto"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              pageSizeOptions: [10, 25, 50, 100],
              showTotal: paginationTotalLabel
                ? () => (
                    <span className="ranking-result__pagination-summary">
                      {paginationTotalLabel}
                    </span>
                  )
                : undefined,
            }}
            scroll={{
              x: tableScrollX > 900 ? tableScrollX : undefined,
              y: Math.max(180, height - TABLE_CHROME_HEIGHT),
            }}
            onChange={(nextPagination) => {
              setPagination({
                current: nextPagination.current ?? 1,
                pageSize: nextPagination.pageSize ?? pagination.pageSize,
              })
            }}
            onRow={(row) => ({
              onMouseEnter: () => handleEnter(row),
              onMouseLeave: handleLeave,
              onClick: () => handleSelect(row),
            })}
          />
        )}
      </ResizableContainer>
    </div>
  )
}
