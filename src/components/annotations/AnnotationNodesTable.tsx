import { Button, Table } from 'antd'
import { useEffect } from 'react'

import { setSharedHoverState } from '@/components/hover/sharedHover'
import { SELECTED_LINKS_TABLE_DEFAULT_PAGE_SIZE, SELECTED_LINKS_TABLE_PAGE_SIZE_OPTIONS } from '@/config/ui'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectCurrentAnnotation, setAtlasNodeIds, toggleAnnotationNode } from '@/store/slices/visualizationUi'

export default function AnnotationNodesTable() {
  const dispatch = useAppDispatch()
  const annotation = useAppSelector(selectCurrentAnnotation)
  useEffect(() => () => setSharedHoverState(null), [annotation.id])

  return (
    <Table
      className="selected-links-table annotations-nodes-table"
      rowKey="id"
      rowSelection={{
        selectedRowKeys: annotation.atlasNodeIds,
        onChange: keys => dispatch(setAtlasNodeIds(keys.map(String))),
      }}
      dataSource={annotation.nodes}
      locale={{ emptyText: 'No nodes annotated yet.' }}
      onRow={node => ({
        onMouseEnter: () => setSharedHoverState({ type: 'node', nodeId: node.id }),
        onMouseLeave: () => setSharedHoverState(null),
        onFocus: () => setSharedHoverState({ type: 'node', nodeId: node.id }),
        onBlur: () => setSharedHoverState(null),
      })}
      columns={[
        { title: 'Node', dataIndex: 'label', sorter: (a, b) => a.label.localeCompare(b.label) },
        { title: 'ID', dataIndex: 'id' },
        {
          title: 'Actions',
          render: (_, node) => (
            <Button
              aria-label={`Remove ${node.label} from ${annotation.name}`}
              onClick={() => {
                setSharedHoverState(null)
                dispatch(toggleAnnotationNode({ ...node, annotationId: annotation.id }))
              }}
            >
              Remove
            </Button>
          ),
        },
      ]}
      pagination={annotation.nodes.length > SELECTED_LINKS_TABLE_DEFAULT_PAGE_SIZE ? {
        defaultPageSize: SELECTED_LINKS_TABLE_DEFAULT_PAGE_SIZE,
        pageSizeOptions: SELECTED_LINKS_TABLE_PAGE_SIZE_OPTIONS,
        showSizeChanger: true,
      } : false}
      size="small"
    />
  )
}
