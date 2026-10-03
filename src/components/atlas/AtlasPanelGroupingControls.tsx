import { CheckOutlined } from '@ant-design/icons'
import { Button, Select } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import GroupingFieldList from '@/components/network/settings/GroupingFieldList'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setAtlasPanelState } from '@/store/slices/visualizationUi'
import { getCommonNodeFields, humanizeFieldName } from '@/utils/atlas/atlasDefinition'

import { useActiveAtlasDefinition } from './hooks/useActiveAtlasDefinition'
import { areStringArraysEqual, moveField, normalizeUniqueFieldList } from './panelFieldUtils'

export default function AtlasPanelGroupingControls() {
  const dispatch = useAppDispatch()
  const atlasPanel = useAppSelector((state) => state.visualizationUi.atlasPanel)
  const atlasDefinition = useActiveAtlasDefinition()
  const availableGroupFields = useMemo(
    () => getCommonNodeFields(atlasDefinition),
    [atlasDefinition],
  )
  const [draftGroupByFields, setDraftGroupByFields] = useState<string[]>(atlasPanel.groupByFields)

  const selectableGroupFields = useMemo(
    () =>
      availableGroupFields.filter(
        (field) =>
          !normalizeUniqueFieldList(draftGroupByFields, availableGroupFields).includes(field),
      ),
    [draftGroupByFields, availableGroupFields],
  )

  const normalizedDraftGroupByFields = useMemo(
    () => normalizeUniqueFieldList(draftGroupByFields, availableGroupFields),
    [availableGroupFields, draftGroupByFields],
  )

  const hasPendingGroupFieldChanges = useMemo(
    () => !areStringArraysEqual(normalizedDraftGroupByFields, atlasPanel.groupByFields),
    [atlasPanel.groupByFields, normalizedDraftGroupByFields],
  )

  const handleMoveGroupField = useCallback((field: string, direction: 'up' | 'down') => {
    setDraftGroupByFields((fields) => moveField(fields, field, direction))
  }, [])

  const handleRemoveGroupField = useCallback((field: string) => {
    setDraftGroupByFields((fields) => fields.filter((value) => value !== field))
  }, [])

  const handleAddGroupField = useCallback((field: string) => {
    setDraftGroupByFields((fields) => (fields.includes(field) ? fields : [...fields, field]))
  }, [])

  const handleApplyGroupFields = useCallback(() => {
    dispatch(
      setAtlasPanelState({
        groupByFields: normalizedDraftGroupByFields,
        groupByFieldsInitialized: true,
        selectedFilters: {},
        collapsedGroups: [],
      }),
    )
    setDraftGroupByFields(normalizedDraftGroupByFields)
  }, [dispatch, normalizedDraftGroupByFields])

  return (
    <div className="atlas-panel__grouping-controls">
      {normalizedDraftGroupByFields.length > 0 ? (
        <GroupingFieldList
          fields={normalizedDraftGroupByFields}
          onMoveField={handleMoveGroupField}
          onRemoveField={handleRemoveGroupField}
        />
      ) : null}

      <div className="atlas-panel__grouping-actions">
        <Select
          key={draftGroupByFields.join('|')}
          placeholder="Add grouping field"
          className="atlas-panel__settings-select"
          options={selectableGroupFields.map((field) => ({
            value: field,
            label: humanizeFieldName(field),
          }))}
          onChange={(value) => handleAddGroupField(String(value))}
          value={null}
          disabled={selectableGroupFields.length === 0}
        />
      </div>
      <Button
        type="primary"
        icon={<CheckOutlined />}
        onClick={handleApplyGroupFields}
        disabled={!hasPendingGroupFieldChanges}
      >
        Apply
      </Button>
    </div>
  )
}
