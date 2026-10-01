import { CheckOutlined, CheckSquareOutlined, ClearOutlined } from '@ant-design/icons'
import { Button, Input, Space, Tooltip, Typography } from 'antd'
import { useCallback, useMemo } from 'react'
import { shallowEqual } from 'react-redux'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setLabelsEnabledMap } from '@/store/slices/atlasUi'
import { setAtlasPanelState } from '@/store/slices/visualizationUi'

import { buildEffectiveNodeEnabledMap, countChangedNodes } from './nodeVisibilityDraft'

const { Search } = Input

type AtlasPanelFiltersProps = {
  query: string
  totalCount: number
  enabledCount: number
  effectiveEnabledCount: number
  allEnabled: boolean
  allDisabled: boolean
}

export function AtlasPanelFilters({
  query,
  totalCount,
  enabledCount,
  effectiveEnabledCount,
  allEnabled,
  allDisabled,
}: AtlasPanelFiltersProps) {
  const dispatch = useAppDispatch()
  const { atlasOrder, draft, labelsById } = useAppSelector(
    (state) => ({
      atlasOrder: state.atlasUi.order,
      draft: state.visualizationUi.atlasPanel.nodeVisibilityDraft,
      labelsById: state.atlasUi.labelsById,
    }),
    shallowEqual,
  )
  const pendingCount = useMemo(
    () => countChangedNodes({ order: atlasOrder, labelsById, draft }),
    [atlasOrder, draft, labelsById],
  )

  const handleQueryChange = useCallback(
    (query: string) => {
      dispatch(setAtlasPanelState({ query }))
    },
    [dispatch],
  )

  const handleApply = useCallback(() => {
    if (!draft) return
    dispatch(
      setLabelsEnabledMap(buildEffectiveNodeEnabledMap({ order: atlasOrder, labelsById, draft })),
    )
    dispatch(setAtlasPanelState({ nodeVisibilityDraft: null }))
  }, [atlasOrder, dispatch, draft, labelsById])

  return (
    <div className="atlas-panel__search-controls">
      <Search
        allowClear
        placeholder="Search node label or id"
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        className="atlas-panel__search"
      />

      <div className="atlas-panel__selection-bar">
        <Space className="atlas-panel__selection-actions">
          <Tooltip title="Select all nodes">
            <Button
              type="primary"
              icon={<CheckSquareOutlined />}
              aria-label="Select all nodes"
              onClick={() =>
                dispatch(
                  setAtlasPanelState({
                    nodeVisibilityDraft: Object.fromEntries(atlasOrder.map((id) => [id, true])),
                  }),
                )
              }
              disabled={allEnabled || totalCount === 0}
            >
              Select All
            </Button>
          </Tooltip>
          <Tooltip title="Clear all nodes">
            <Button
              type="primary"
              icon={<ClearOutlined />}
              aria-label="Clear all nodes"
              onClick={() =>
                dispatch(
                  setAtlasPanelState({
                    nodeVisibilityDraft: Object.fromEntries(atlasOrder.map((id) => [id, false])),
                  }),
                )
              }
              disabled={allDisabled || totalCount === 0}
            >
              Clear All
            </Button>
          </Tooltip>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleApply}
            disabled={pendingCount === 0}
          >
            Apply
          </Button>
        </Space>
        <Typography.Text type="secondary" className="atlas-panel__node-summary">
          <span>{totalCount} nodes</span>
          <span>{enabledCount} active now</span>
          <span>{effectiveEnabledCount} after applying selection</span>
        </Typography.Text>
      </div>
    </div>
  )
}
