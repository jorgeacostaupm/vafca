import type { TableProps } from 'antd'
import { ConfigProvider } from 'antd'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toggleAnnotationNode } from '@/store/slices/visualizationUi'
import { selectActiveAnnotation, selectAnnotationNodeColors } from '@/store/slices/visualizationUi/annotationSelectors'
import type { RankingRow } from '@/types/rankings'
import { getReadableTextColor } from '@/utils/groupingColoring'

export const getNodeRankingChanges = (rows: RankingRow[], nodeIds: Set<string>, selected: boolean) => {
  const seen = new Set<string>()
  return rows.filter(row => {
    if (row.type !== 'node' || seen.has(row.nodeId)) return false
    seen.add(row.nodeId)
    return nodeIds.has(row.nodeId) !== selected
  })
}

export const useNodeRankingSelection = (
  rows: RankingRow[],
  rowKey: (row: RankingRow) => string,
): NonNullable<TableProps<RankingRow>['rowSelection']> => {
  const dispatch = useAppDispatch()
  const annotation = useAppSelector(selectActiveAnnotation)
  const colors = useAppSelector(selectAnnotationNodeColors)

  const setSelected = (changedRows: RankingRow[], selected: boolean) => {
    if (!annotation) return
    const nodeIds = new Set(annotation.nodes.map(node => node.id))
    for (const row of getNodeRankingChanges(changedRows, nodeIds, selected)) {
      if (row.type === 'node') {
        dispatch(toggleAnnotationNode({ id: row.nodeId, label: row.label, annotationId: annotation.id }))
      }
    }
  }

  return {
    selectedRowKeys: rows.filter(row => row.type === 'node' && colors[row.nodeId]).map(rowKey),
    getCheckboxProps: () => ({ disabled: !annotation }),
    renderCell: (_checked, row, _index, checkbox) => {
      const color = row.type === 'node' ? colors[row.nodeId] : undefined
      return color ? (
        <ConfigProvider theme={{ token: {
          colorPrimary: color,
          colorPrimaryHover: color,
          colorTextLightSolid: getReadableTextColor(color),
        } }}>
          {checkbox}
        </ConfigProvider>
      ) : checkbox
    },
    onSelect: (row) => {
      if (!annotation || row.type !== 'node') return
      setSelected([row], !annotation.nodes.some(node => node.id === row.nodeId))
    },
    onSelectAll: (selected, _selectedRows, changedRows) => setSelected(changedRows, selected),
  }
}
