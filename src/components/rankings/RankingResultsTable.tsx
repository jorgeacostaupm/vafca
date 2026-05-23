import { Button, Space, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EyeOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { type ReactNode, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addNetworkViewAndFormat } from '@/store/slices/networkVisualization'
import { addSelectedLink, removeSelectedLink } from '@/store/slices/visualizationUi'
import ResizableContainer from '@/components/layout/ResizableContainer'
import { getMatrixCompoundId } from '@/utils/rankings/rankingMatrixMetadata'
import { getRankingMetricLabel } from '@/components/rankings/rankingOptions'
import { useRankingRowInteractions } from '@/components/rankings/useRankingRowInteractions'
import type { LinkRankingRow, MatrixRankingRow, RankingResult, RankingRow } from '@/types/rankings'

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
  const connectivity = useAppSelector((state) => state.dataset.data?.connectivity)
  const selectedLinks = useAppSelector((state) => state.visualizationUi.selectedLinks)
  const { handleEnter, handleLeave, handleSelect } = useRankingRowInteractions()
  const scoreColumnTitle = getRankingMetricLabel(result.query)

  const selectedLinkIds = useMemo(
    () => new Set(selectedLinks.map((link) => link.id)),
    [selectedLinks],
  )

  const matrixLinksCountLabel = useMemo(() => {
    if (result.query.target !== 'matrices') return undefined
    const counts = result.rows.flatMap((row) => (row.type === 'matrix' ? [row.nLinksUsed] : []))
    if (counts.length === 0) return undefined
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    return min === max ? `# links ${min}` : `# links ${min}-${max}`
  }, [result.query.target, result.rows])

  const roiIncidentLinksCountLabel = useMemo(() => {
    if (result.query.target !== 'rois') return undefined
    const counts = result.rows.flatMap((row) =>
      row.type === 'roi' ? [row.nIncidentLinks] : [],
    )
    if (counts.length === 0) return undefined
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    return min === max ? `# incident links ${min}` : `# incident links ${min}-${max}`
  }, [result.query.target, result.rows])

  const paginationTotalLabel =
    matrixLinksCountLabel ?? roiIncidentLinksCountLabel

  const createSelectedLink = (row: LinkRankingRow) => {
    const { direct } = getLinkIds(row)
    const sourceMatrix = connectivity?.matrixIndex[row.bestMatrixId ?? result.query.matrixId ?? '']
    return {
      id: direct,
      rowId: row.sourceId,
      colId: row.targetId,
      rowLabel: row.sourceLabel,
      colLabel: row.targetLabel,
      sources: [
        {
          compoundId: sourceMatrix ? getMatrixCompoundId(sourceMatrix) : '',
          matrixLabel: row.bestLayerId ?? 'Ranking',
          value: row.score,
        },
      ],
    }
  }

  const addLink = (row: LinkRankingRow) => {
    const { direct, reverse } = getLinkIds(row)
    if (selectedLinkIds.has(direct) || selectedLinkIds.has(reverse)) {
      dispatch(removeSelectedLink(selectedLinkIds.has(direct) ? direct : reverse))
      return
    }
    dispatch(addSelectedLink(createSelectedLink(row)))
  }

  const addRankingLinks = () => {
    result.rows
      .filter((row): row is LinkRankingRow => row.type === 'link')
      .forEach((row) => {
        const { direct, reverse } = getLinkIds(row)
        if (selectedLinkIds.has(direct) || selectedLinkIds.has(reverse)) return
        dispatch(addSelectedLink(createSelectedLink(row)))
      })
  }

  const removeRankingLinks = () => {
    result.rows
      .filter((row): row is LinkRankingRow => row.type === 'link')
      .forEach((row) => {
        const { direct, reverse } = getLinkIds(row)
        if (selectedLinkIds.has(direct)) dispatch(removeSelectedLink(direct))
        if (selectedLinkIds.has(reverse)) dispatch(removeSelectedLink(reverse))
      })
  }

  const linkActionsTitle = (
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
  )

  const openMatrixView = (row: MatrixRankingRow) => {
    const matrix = connectivity?.matrixIndex[row.matrixId]
    if (!matrix) return
    void dispatch(
      addNetworkViewAndFormat({
        type: 'matrix',
        compoundId: getMatrixCompoundId(matrix),
        label: row.label,
        measureId: row.measureId ?? matrix.context.measureId,
        statId: row.statisticId ?? matrix.stat.id,
      }),
    )
  }

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

    if (result.query.target === 'matrices') {
      return [
        ...common,
        {
          key: 'layer',
          title: 'Layer',
          dataIndex: 'layerId',
          sorter: (a, b) =>
            compareText(
              a.type === 'matrix' ? a.layerId : undefined,
              b.type === 'matrix' ? b.layerId : undefined,
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
            row.type === 'matrix' ? (
              <Button
                size="small"
                icon={<EyeOutlined />}
                aria-label="Open as Network View"
                onClick={(event) => {
                  event.stopPropagation()
                  openMatrixView(row)
                }}
              />
            ) : null,
        },
      ]
    }

    if (result.query.target === 'links') {
      const isAggregatedLinkRanking = result.query.linkCollectionMode !== 'expanded'
      const isOneRowPerLayer = result.query.linkCollectionMode === 'expanded'
      const layerIds = Array.from(
        new Set(
          result.rows.flatMap((row) =>
            row.type === 'link' ? Object.keys(row.valuesByLayer ?? {}) : [],
          ),
        ),
      ).sort()
      const hasBestLayer = result.rows.some((row) => row.type === 'link' && Boolean(row.bestLayerId))
      const hasMultipleMatrices = result.rows.some(
        (row) =>
          row.type === 'link' && typeof row.nMatricesUsed === 'number' && row.nMatricesUsed > 1,
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
          ? layerIds.map((layerId) => ({
              key: `layer-${layerId}`,
              title: connectivity?.catalogs.layers[layerId]?.label ?? layerId,
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
        ...(!isAggregatedLinkRanking && hasMultipleMatrices
          ? [
              {
                key: 'nMatricesUsed',
                title: 'N matrices',
                dataIndex: 'nMatricesUsed',
                sorter: (a: RankingRow, b: RankingRow) =>
                  compareNumber(
                    a.type === 'link' ? a.nMatricesUsed : undefined,
                    b.type === 'link' ? b.nMatricesUsed : undefined,
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
        key: 'roi',
        title: 'ROI',
        dataIndex: 'label',
        ellipsis: true,
        sorter: (a, b) =>
          compareText(
            a.type === 'roi' ? a.label : undefined,
            b.type === 'roi' ? b.label : undefined,
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
            a.type === 'roi' ? a.nIncidentLinks : undefined,
            b.type === 'roi' ? b.nIncidentLinks : undefined,
          ),
      },
    ]
  }, [connectivity, result.query, result.rows, scoreColumnTitle, selectedLinkIds])

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
              row.type === 'matrix'
                ? row.matrixId
                : row.type === 'roi'
                  ? row.roiId
                  : `${row.sourceId}::${row.targetId}::${row.bestMatrixId ?? 'all'}`
            }
            columns={columns}
            className={[
              'ranking-result__table',
              result.query.target === 'links' ? 'ranking-result__table--links' : '',
              result.query.target === 'rois' ? 'ranking-result__table--rois' : '',
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
