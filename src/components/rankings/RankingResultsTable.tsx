import { EyeOutlined, SwapOutlined } from '@ant-design/icons'
import { Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { type CSSProperties, type ReactNode, useCallback, useMemo, useState } from 'react'

import ResizableContainer from '@/components/layout/ResizableContainer'
import { getRankingMetricLabel } from '@/components/rankings/rankingOptions'
import { useRankingRowInteractions } from '@/components/rankings/useRankingRowInteractions'
import { useAtlasLabelPresentation } from '@/hooks/useAtlasLabelPresentation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'
import { addNetworkViewAndFormat } from '@/store/slices/networkVisualization'
import { addSelectedLink, removeSelectedLinks } from '@/store/slices/visualizationUi'
import { selectActiveAnnotationLinks } from '@/store/slices/visualizationUi/annotationSelectors';
import type { LinkRankingRow, NetworkRankingRow, RankingResult, RankingRow } from '@/types/rankings'
import { toDatasetNetworkSummary } from '@/utils/datasetAccessors'
import { buildNetworkSummaryLabel } from '@/utils/matrixViewUtils'
import { getNetworkCompoundId } from '@/utils/rankings/rankingNetworkMetadata'
import { getRankingDimensions, getRankingDimensionValue, getRankingExtremeLabel } from '@/utils/rankings/rankingPresentation'

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

const getLinkIds = (row: LinkRankingRow) => ({
  direct: `${row.sourceId}::${row.targetId}`,
  reverse: `${row.targetId}::${row.sourceId}`,
})

const formatLinkLabel = (row: LinkRankingRow) => `${row.sourceLabel} ↔ ${row.targetLabel}`

const getRankingRowKey = (row: RankingRow) =>
  row.type === 'network'
    ? row.networkId
    : row.type === 'node'
      ? `${row.networkSourceId}::${row.nodeId}`
      : `${row.networkSourceId}::${row.sourceId}::${row.targetId}::${row.bestNetworkId ?? 'all'}`

export default function RankingResultsTable({ result }: Props) {
  const dispatch = useAppDispatch()
  const activeAnnotationId = useAppSelector(state => state.visualizationUi.activeAnnotationId)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 25 })
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null)
  const datasetContent = useAppSelector((state) => selectDatasetContent(state))
  const selectedLinks = useAppSelector(selectActiveAnnotationLinks)
  const { nodeColors } = useAtlasLabelPresentation()
  const { handleEnter, handleLeave, handleSelect } = useRankingRowInteractions()
  const scoreColumnTitle = getRankingMetricLabel(result.query)

  const selectedLinkIds = useMemo(
    () => new Set(selectedLinks.map((link) => link.id)),
    [selectedLinks],
  )
  const isLinkSelected = useCallback((row: LinkRankingRow) => {
    const { direct, reverse } = getLinkIds(row)
    return selectedLinkIds.has(direct) || selectedLinkIds.has(reverse)
  }, [selectedLinkIds])
  const renderRoi = useCallback((id: string, label: string) => {
    const color = nodeColors[id]
    return (
      <span
        className="ranking-roi-label"
        style={{
          '--ranking-roi-color': color,
        } as CSSProperties}
      >
        {label}
      </span>
    )
  }, [nodeColors])

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
          networkLabel: row.bestAspectValue ?? 'Ranking',
          value: row.score,
        },
      ],
    }
  }, [datasetContent, result.query.networkId])

  const addLink = useCallback((row: LinkRankingRow) => {
    const { direct, reverse } = getLinkIds(row)
    if (selectedLinkIds.has(direct) || selectedLinkIds.has(reverse)) {
      dispatch(removeSelectedLinks({ annotationId: activeAnnotationId!, ids: [selectedLinkIds.has(direct) ? direct : reverse] }))
      return
    }
    dispatch(addSelectedLink(createSelectedLink(row)))
  }, [activeAnnotationId, createSelectedLink, dispatch, selectedLinkIds])

  const rankedLinks = result.rows.filter(
    (row): row is LinkRankingRow => row.type === 'link',
  )

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
        statisticId: summary.statisticId,
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
            row.type === 'link' ? (
              <div className="ranking-link-label" title={formatLinkLabel(row)}>
                {renderRoi(row.sourceId, row.sourceLabel)}
                <span className="ranking-link-label__direction" aria-hidden="true">
                  <SwapOutlined />
                </span>
                {renderRoi(row.targetId, row.targetLabel)}
              </div>
            ) : '',
        },
        {
          key: 'score', title: scoreColumnTitle, dataIndex: 'score', render: formatScore,
          sorter: (a, b) => compareNumber(a.score, b.score),
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
        render: (_: unknown, row: RankingRow) =>
          row.type === 'node' ? renderRoi(row.nodeId, row.label) : '',
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
    openNetworkView,
    result.query,
    renderRoi,
    scoreColumnTitle,
  ])

  const columns = useMemo<ColumnsType<RankingRow>>(() => {
    const dimensions = datasetContent ? getRankingDimensions(result.query, datasetContent) : []
    const variableColumns: RankingTableColumn[] = dimensions.filter(dimension =>
      dimension.values.length > 1 && (dimension.id === 'source' || result.query.target === 'networks' ||
        (result.query.target === 'links' && (result.query.linkCollectionMode === 'expanded' || getRankingExtremeLabel(result.query)))),
    ).map(dimension => {
      const extreme = dimension.id !== 'source' && result.query.target === 'links' && result.query.linkCollectionMode !== 'expanded'
        ? getRankingExtremeLabel(result.query) : undefined
      const value = (row: RankingRow) => {
        const raw = datasetContent ? getRankingDimensionValue(row, dimension.id, result.query, datasetContent) : undefined
        return raw && (dimension.id === 'source' || row.type === 'network') ? dimension.labelFor(raw) : raw
      }
      return {
        key: `dimension-${dimension.id}`, title: `${dimension.label}${extreme ? ` (${extreme})` : ''}`,
        render: (_: unknown, row: RankingRow) => value(row) ?? '—',
        sorter: (a, b) => compareText(value(a), value(b)),
      }
    })
    const visibleColumns = [...baseColumns]
    const scoreIndex = visibleColumns.findIndex(column => column.key === 'score')
    visibleColumns.splice(scoreIndex, 0, ...variableColumns)
    const keys = visibleColumns.map((column) => column.key)
    const orderedKeys = [
      ...columnOrder.filter((key) => keys.includes(key)),
      ...keys.filter((key) => !columnOrder.includes(key)),
    ]
    const columnByKey = new Map(visibleColumns.map((column) => [column.key, column]))

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
  }, [baseColumns, columnOrder, draggedColumnKey, datasetContent, result.query])

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
            rowKey={getRankingRowKey}
            rowSelection={result.query.target === 'links' ? {
              selectedRowKeys: rankedLinks.filter(isLinkSelected).map(getRankingRowKey),
              onSelect: (row) => {
                if (row.type === 'link') addLink(row)
              },
              onSelectAll: (_selected, _selectedRows, changedRows) => {
                changedRows.forEach((row) => {
                  if (row.type === 'link') addLink(row)
                })
              },
            } : undefined}
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
